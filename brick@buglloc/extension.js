'use strict';

const Lang = imports.lang;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Atk = imports.gi.Atk;

const owner = 'org.brick.Brick'

// see "introspection_xml" on https://github.com/buglloc/brick/blob/master/brick/external_interface/dbus_protocol.cpp
const DBusAppIface = '<node>\
  <interface name="org.brick.Brick.AppInterface">\
    <method name="UserAway" />\
    <method name="UserPresent" />\
    <method name="ShowAddAccountDialog">\
       <arg type="b" name="switch_on_save" direction="in"/>\
    </method>\
    <method name="ShowAccountsDialog" />\
    <method name="Quit" />\
    <signal name="IndicatorTooltipChanged">\
      <arg type="s" name="text"/>\
    </signal>\
    <signal name="IndicatorStateChanged">\
      <arg type="s" name="state"/>\
    </signal>\
    <signal name="IndicatorBadgeChanged">\
      <arg type="i" name="badge"/>\
      <arg type="b" name="important"/>\
    </signal>\
  </interface>\
</node>';
const DBusAppProxy = Gio.DBusProxy.makeProxyWrapper(DBusAppIface);

// see "introspection_xml" on https://github.com/buglloc/brick/blob/master/brick/external_interface/dbus_protocol.cpp
const DBusAppWindowIface = '<node>\
  <interface name="org.brick.Brick.AppWindowInterface">\
    <method name="Hide" />\
    <method name="Present" />\
    <method name="ToggleVisibility" />\
  </interface>\
</node>';
const DBusAppWindowProxy = Gio.DBusProxy.makeProxyWrapper(DBusAppWindowIface);

const IndicatorName = 'Brick';
const OfflineIcon = 'offline';
const OnlineIcon = 'online';

let BrickIndicator;

const Brick = new Lang.Class({
    Name: IndicatorName,
    Extends: PanelMenu.Button,

    _init: function(metadata, params) {
        this.parent(null, IndicatorName);
        this.actor.accessible_role = Atk.Role.TOGGLE_BUTTON;

        this._app = new DBusAppProxy(
          Gio.DBus.session,
          owner,
          '/org/brick/Brick/App'
        );
        
        this._appWindow = new DBusAppWindowProxy(
          Gio.DBus.session,
          'org.brick.Brick',
          '/org/brick/Brick/AppWindow'
        );

        this._appPropsChangedId = this._app.connect(
          'notify',
          Lang.bind(this, this._appPropsChanged)
        );
        
        this._stateChangedId = this._app.connectSignal(
          'IndicatorStateChanged',
          Lang.bind(this, this._indicatorStateChanged)
        );
        
        this._icon = new St.Icon({
            icon_name: this._app.g_name_owner? OnlineIcon : OfflineIcon,
            style_class: 'system-status-icon'
        });

        this.actor.add_actor(this._icon);
        this.actor.add_style_class_name('panel-status-button');
        this.actor.connect('button-press-event', Lang.bind(this, this.toggleVisibility));
    },

    toggleVisibility: function() {
        this._appWindow.ToggleVisibilityRemote();
    },

    _appPropsChanged: function(proxy) {
      if (proxy.g_name_owner) {
        this.actor.show();
      } else {
        this._icon.icon_name = OfflineIcon;
        this.actor.hide();
      }
    },

    _indicatorStateChanged: function(proxy, sender, [state]) {
      if (state)
        this._icon.icon_name = state + '';
    },

    destroy: function() {
        // disconnect from signals
        if (this._stateChangedId) {
            this._app.disconnectSignal(this._stateChangedId);
            this._stateChangedId = 0;
        }
        if (this._appPropsChangedId) {
            this._app.disconnect(this._appPropsChangedId);
            this._appPropsChangedId = 0;
        }
        this.parent();
    }
});

function init(extensionMeta) {
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

function enable() {
    BrickIndicator = new Brick();
    Main.panel.addToStatusArea(IndicatorName, BrickIndicator);
}

function disable() {
    BrickIndicator.destroy();
    BrickIndicator = null;
}
