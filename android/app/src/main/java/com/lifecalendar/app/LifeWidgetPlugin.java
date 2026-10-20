package com.lifecalendar.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * 網頁端（app.js）和桌面小工具之間的橋樑。
 * update：把生日、預期壽命、語言存起來，並重畫所有小工具。
 * requestPin：請系統把小工具加到主畫面（Android 8 以上、且桌面程式支援時）。
 */
@CapacitorPlugin(name = "LifeWidget")
public class LifeWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        String birth = call.getString("birth", "");
        Integer life = call.getInt("life", 80);
        String lang = call.getString("lang", "zh");
        ctx.getSharedPreferences(LifeWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString("birth", birth == null ? "" : birth)
            .putInt("life", life == null ? 80 : life)
            .putString("lang", lang == null ? "zh" : lang)
            .apply();
        LifeWidgetProvider.refreshAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void requestPin(PluginCall call) {
        boolean ok = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager mgr = getContext().getSystemService(AppWidgetManager.class);
            if (mgr != null && mgr.isRequestPinAppWidgetSupported()) {
                ok = mgr.requestPinAppWidget(new ComponentName(getContext(), LifeWidgetProvider.class), null, null);
            }
        }
        JSObject ret = new JSObject();
        ret.put("supported", ok);
        call.resolve(ret);
    }
}
