'use strict';

const Lang = imports.lang;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Atk = imports.gi.Atk;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DBus = Extension.imports.dbus;
const GSession = imports.misc.gnomeSession;

const owner = 'org.brick.Brick'

const IndicatorName = 'Brick';
const OfflineIcon = 'my-brick-offline';
const OnlineIcon = 'my-brick-online';

let BrickIndicator;

const Brick = new Lang.Class({
    Name: IndicatorName,
    Extends: PanelMenu.Button,

    _init: function(metadata, params) {
        this.parent(null, IndicatorName);
        this.actor.accessible_role = Atk.Role.TOGGLE_BUTTON;

        this._app = DBus.App(owner);

        this._appWindow = new DBus.AppWindow(owner);

        this._appPropsChangedId = this._app.connect(
          'notify',
          Lang.bind(this, this._appPropsChanged)
        );

        this._stateChangedId = this._app.connectSignal(
          'IndicatorStateChanged',
          Lang.bind(this, this._indicatorStateChanged)
        );
        this._gSessionPresence = new GSession.Presence();
        /*this._signal = this._gSessionPresence.connect(
            'StatusChanged',
            Lang.bind(this, this._onStatusChanged)
        );*/

        this._icon = new St.Icon({
            icon_name: this._app.g_name_owner? OnlineIcon : OfflineIcon,
            style_class: 'system-status-icon'
        });

        this._appPropsChanged(this._app);
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
        this._icon.icon_name = 'my-brick-'+state;
    },
    /*_onStatusChanged: function(status) {
        switch (status) {
            case GSession.PresenceStatus.BUSY:
                this._app.UserAway();
                break;
            case GSession.PresenceStatus.IDLE:
                this._app.UserAway();
                break;
            case GSession.PresenceStatus.AVALIABLE:
                this._app.UserPresent();
                break;
            case GSession.PresenceStatus.INVISIBLE:
                this._app.UserAway();
                break
        }
    }*/

    destroy: function() {
        // disconnect from signals
        this._gSessionPresence.disconnect(this._signal);
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
