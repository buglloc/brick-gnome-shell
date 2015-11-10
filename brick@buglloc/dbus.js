
const Gio = imports.gi.Gio;

// see "introspection_xml" on https://github.com/buglloc/brick/blob/master/brick/external_interface/dbus_protocol.cc
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
function App(owner, init_callback, cancellable) {
  return new DBusAppProxy(
          Gio.DBus.session,
          owner,
          '/org/brick/Brick/App',
          init_callback,
          cancellable
        );
}

// see "introspection_xml" on https://github.com/buglloc/brick/blob/master/brick/external_interface/dbus_protocol.cc
const DBusAppWindowIface = '<node>\
  <interface name="org.brick.Brick.AppWindowInterface">\
    <method name="Hide" />\
    <method name="Present" />\
    <method name="ToggleVisibility" />\
  </interface>\
</node>';
const DBusAppWindowProxy = Gio.DBusProxy.makeProxyWrapper(DBusAppWindowIface);
function AppWindow(owner, init_callback, cancellable) {
  return new DBusAppWindowProxy(
          Gio.DBus.session,
          owner,
          '/org/brick/Brick/AppWindow',
          init_callback,
          cancellable
        );
}