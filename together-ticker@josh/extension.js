/* extension.js — DeepSeek Credit Ticker for GNOME Shell */
/* Direct API call to api.deepseek.com/user/balance */
/* GNOME 45+ ES module format — Soup 3.0 */

import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Soup from 'gi://Soup';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const KeyFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'deepseek-ticker', 'key']);
const RefreshIntervalSecs = 10;
const ApiUrl = 'https://api.deepseek.com/user/balance';

function readApiKey() {
    try {
        let file = Gio.File.new_for_path(KeyFile);
        if (!file.query_exists(null)) return null;
        let [ok, contents] = file.load_contents(null);
        if (!ok || !contents) return null;
        let decoder = new TextDecoder();
        let key = decoder.decode(contents).trim();
        return key.length > 0 ? key : null;
    } catch (e) {
        return null;
    }
}

function formatBalance(balance) {
    return 'DS: $' + parseFloat(balance).toFixed(2);
}

const DeepseekTicker = GObject.registerClass(
class DeepseekTicker extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'DeepSeek Credit Ticker', false);

        // Single persistent session — avoids Soup setup jank on each poll
        this._session = new Soup.Session();
        this._lastText = 'DS: ...';
        this._hasData = false;

        this._label = new St.Label({
            text: this._lastText,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'deepseek-ticker-label loading'
        });
        this.add_child(this._label);

        // Click to refresh immediately
        this.connect('button-press-event', () => {
            this._refresh();
        });

        // Poll every 10 seconds
        this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            RefreshIntervalSecs,
            () => {
                this._refresh();
                return GLib.SOURCE_CONTINUE;
            }
        );

        // First fetch on idle
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._refresh();
            return GLib.SOURCE_REMOVE;
        });
    }

    _setText(text) {
        if (text === this._lastText) return;
        this._lastText = text;
        this._label.set_text(text);
    }

    _refresh() {
        let key = readApiKey();
        if (!key) {
            this._setText('DS: ?');
            this._label.style_class = 'deepseek-ticker-label error';
            return;
        }

        // Never touch the displayed text on poll — only update when
        // the response arrives and the value actually changed.

        let message = Soup.Message.new('GET', ApiUrl);
        message.get_request_headers().append('Authorization', 'Bearer ' + key);

        this._session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (session_, result) => {
                try {
                    let bytes = session_.send_and_read_finish(result);
                    let status = message.get_status();
                    if (status !== 200) return; // keep last value, no flicker
                    let decoder = new TextDecoder();
                    this._parseAndDisplay(decoder.decode(bytes.get_data()));
                } catch (e) {
                    log('[DS Ticker] fetch error: ' + e);
                    // keep last value, no flicker
                }
            }
        );
    }

    _parseAndDisplay(body) {
        try {
            let data = JSON.parse(body);
            if (!data.balance_infos || data.balance_infos.length === 0) return;
            let text = formatBalance(data.balance_infos[0].total_balance);
            if (text === this._lastText) return; // no change, no update
            this._setText(text);
            this._label.style_class = 'deepseek-ticker-label';
            this._hasData = true;
        } catch (e) {
            log('[DS Ticker] parse error: ' + e);
        }
    }

    destroy() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        this._session = null;
        super.destroy();
    }
});

export default class Extension {
    constructor() {
        this._indicator = null;
    }

    enable() {
        this._indicator = new DeepseekTicker();
        Main.panel.addToStatusArea('deepseek-ticker', this._indicator, 1, 'right');
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
