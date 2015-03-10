const St = imports.gi.St;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

let button, icon;

function _cmdstdout(cmd) {
    let stdout = "";
    let [res, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(
        null, cmd, null, GLib.SpawnFlags.SEARCH_PATH, null);
    let out_reader = new Gio.DataInputStream(
        {base_stream: new Gio.UnixInputStream({fd: out_fd})});
    while (true) {
        let [out, size] = out_reader.read_line(null);
        if (size > 1) {
            stdout += out.toString() + "\n";
        } else {
            break;
        }
    }
    return stdout;
}

function _get_touchpad_id() {
    let id = 0;
    let xinput_lines = _cmdstdout(["xinput"]);
    xinput_lines.split("\n").forEach(function(line) {
        if (line.search(/touchpad/i) != -1 || line.search(/ELAN/) != -1) {
            id = parseInt(line.match(/id=(\d+)/)[1]);
        }
    });
    return id;
}

function _is_enabled(touchpad_id) {
    let enabled = false;
    let out = _cmdstdout(["xinput", "list-props", touchpad_id.toString()]);
    out.split("\n").forEach(function(line) {
        if (line.search(/^\s*Device Enabled \(\d+\):\s+[01]$/) != -1) {
            enabled = line.match(
                /^\s*Device Enabled \(\d+\):\s+([01])$/)[1] == '1';
        }
    });
    return enabled;
}

function _disable_touchpad(touchpad_id) {
    _cmdstdout(["xinput", "disable", touchpad_id.toString()]);
}

function _enable_touchpad(touchpad_id) {
    _cmdstdout(["xinput", "enable", touchpad_id.toString()]);
}

function _toggle_touchpad() {
    let id = _get_touchpad_id();
    if (_is_enabled(id)) {
        _disable_touchpad(id);
        return false;
    } else {
        _enable_touchpad(id);
        return true;
    }
}

function init() {
    button = new St.Bin(
        {
            style_class: 'panel-button',
            reactive: true,
            can_focus: true,
            x_fill: true,
            y_fill: false,
            track_hover: true});
    if (_is_enabled(_get_touchpad_id())) {
        icon = new St.Icon({style_class: "touchpad-icon"});
    } else {
        icon = new St.Icon({style_class: "touchpad-icon-disabled"});
    }
    button.set_child(icon);
    button.connect('button-press-event', function(){
        if (_toggle_touchpad()) {
            icon = new St.Icon({style_class: "touchpad-icon"});
        } else {
            icon = new St.Icon({style_class: "touchpad-icon-disabled"});
        }
        button.set_child(icon);
    });
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
}
