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

function _is_enabled() {
    let out = _cmdstdout(["gsettings", "get", "org.gnome.settings-daemon.peripherals.touchpad", "touchpad-enabled"]);
    return out.indexOf("true") != -1;
}

function _disable_touchpad() {
	_cmdstdout(["gsettings", "set", "org.gnome.settings-daemon.peripherals.touchpad", "touchpad-enabled", "false"]);
}

function _enable_touchpad() {
	_cmdstdout(["gsettings", "set", "org.gnome.settings-daemon.peripherals.touchpad", "touchpad-enabled", "true"]);
}

function _toggle_touchpad() {
    if (_is_enabled()) {
        _disable_touchpad();
        return false;
    } else {
        _enable_touchpad();
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
    if (_is_enabled()) {
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
