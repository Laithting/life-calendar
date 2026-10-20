package com.lifecalendar.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import java.text.NumberFormat;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.Locale;
import java.util.TimeZone;

/**
 * 一生日歷的桌面小工具。
 * 小尺寸：週數、一生進度，加上一格一年的格子；拉高之後改成一格一週的格子。
 * 所有數字都在手機上依生日計算，每小時與每天午夜後更新。
 */
public class LifeWidgetProvider extends AppWidgetProvider {

    public static final String PREFS = "life_widget";

    private static final int BG = 0xFF10162B;
    private static final int LIVED = 0xFF8796D8;
    private static final int NOW = 0xFFF0B84E;
    private static final int LINE = 0xFF2B3456;
    // RemoteViews 的圖片會經過程序間傳遞，太大會失敗，所以限制邊長
    private static final int MAX_PX = 480;

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) render(ctx, mgr, id);
        scheduleMidnight(ctx);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, Bundle opts) {
        render(ctx, mgr, id);
    }

    public static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, LifeWidgetProvider.class));
        for (int id : ids) render(ctx, mgr, id);
        if (ids.length > 0) scheduleMidnight(ctx);
    }

    /** 安排在下一個午夜過後更新一次（不喚醒手機，不需要精準鬧鐘權限）。 */
    private static void scheduleMidnight(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar next = Calendar.getInstance();
        next.add(Calendar.DAY_OF_YEAR, 1);
        next.set(Calendar.HOUR_OF_DAY, 0);
        next.set(Calendar.MINUTE, 1);
        next.set(Calendar.SECOND, 0);
        Intent i = new Intent(ctx, LifeWidgetProvider.class).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        int[] ids = AppWidgetManager.getInstance(ctx).getAppWidgetIds(new ComponentName(ctx, LifeWidgetProvider.class));
        i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.set(AlarmManager.RTC, next.getTimeInMillis(), pi);
    }

    // ---------- 日期計算（與網站相同的規則） ----------

    private static long dayNumber(int y, int m, int d) {
        GregorianCalendar c = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
        c.clear();
        c.set(y, m - 1, d);
        return c.getTimeInMillis() / 86400000L;
    }

    private static int daysInMonth(int y, int m) {
        GregorianCalendar c = new GregorianCalendar(y, m - 1, 1);
        return c.getActualMaximum(Calendar.DAY_OF_MONTH);
    }

    /** 生日加 n 年（2/29 在平年算 2/28）。 */
    private static long addYears(int by, int bm, int bd, int n) {
        return dayNumber(by + n, bm, Math.min(bd, daysInMonth(by + n, bm)));
    }

    static void render(Context ctx, AppWidgetManager mgr, int id) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String birth = sp.getString("birth", "");
        int life = sp.getInt("life", 80);
        boolean zh = !"en".equals(sp.getString("lang", "zh"));

        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.life_widget);
        Intent launch = new Intent(ctx, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent open = PendingIntent.getActivity(ctx, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root, open);
        v.setTextViewText(R.id.widget_title, zh ? "一生日歷" : "Life Calendar");

        int by, bm, bd;
        try {
            String[] p = birth.split("-");
            by = Integer.parseInt(p[0]);
            bm = Integer.parseInt(p[1]);
            bd = Integer.parseInt(p[2]);
        } catch (Exception e) {
            v.setTextViewText(R.id.widget_week, zh ? "打開 App 設定生日" : "Open the app to set your birthday");
            v.setTextViewText(R.id.widget_sub, "");
            v.setViewVisibility(R.id.widget_grid, View.GONE);
            mgr.updateAppWidget(id, v);
            return;
        }

        Calendar now = Calendar.getInstance();
        long today = dayNumber(now.get(Calendar.YEAR), now.get(Calendar.MONTH) + 1, now.get(Calendar.DAY_OF_MONTH));
        long b = dayNumber(by, bm, bd);
        long death = addYears(by, bm, bd, life);
        long lived = today - b;
        long weekNo = lived / 7 + 1;
        double total = death - b;
        long weeksLeft = Math.max(0, Math.round(total / 7.0 - weekNo + 1));
        double pct = Math.max(0, Math.min(1, lived / total));
        int age = now.get(Calendar.YEAR) - by;
        if (addYears(by, bm, bd, age) > today) age--;
        age = Math.max(0, age);
        int weekInYear = (int) Math.min(51, (today - addYears(by, bm, bd, age)) / 7);

        NumberFormat nf = NumberFormat.getIntegerInstance(zh ? Locale.TAIWAN : Locale.US);
        String pctText = String.format(Locale.US, "%.1f%%", pct * 100);
        v.setTextViewText(R.id.widget_week, zh ? "第 " + nf.format(weekNo) + " 週" : "Week " + nf.format(weekNo));
        v.setTextViewText(R.id.widget_sub, zh
            ? "一生 " + pctText + " · 還有 " + nf.format(weeksLeft) + " 週"
            : pctText + " of life · " + nf.format(weeksLeft) + " weeks left");

        // 依小工具實際大小決定格子
        Bundle opts = mgr.getAppWidgetOptions(id);
        float density = ctx.getResources().getDisplayMetrics().density;
        int wDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 160);
        int hDp = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 160);
        int gridWdp = wDp - 28;
        int gridHdp = hDp - 28 - 66;
        if (gridHdp < 36 || gridWdp < 60) {
            v.setViewVisibility(R.id.widget_grid, View.GONE);
        } else {
            int gw = Math.min(MAX_PX, Math.round(gridWdp * density));
            int gh = Math.min(MAX_PX, Math.round(gridHdp * density));
            int rows = Math.max(life, age + 1);
            Bitmap bmp = hDp >= 280 ? weeksGrid(gw, gh, rows, age, weekInYear) : yearsGrid(gw, gh, rows, age);
            v.setViewVisibility(R.id.widget_grid, View.VISIBLE);
            v.setImageViewBitmap(R.id.widget_grid, bmp);
        }
        mgr.updateAppWidget(id, v);
    }

    /** 一格一年，每列十年。 */
    private static Bitmap yearsGrid(int w, int h, int years, int age) {
        int cols = 10, rows = (years + cols - 1) / cols;
        float gap = Math.max(2f, Math.min(w, h) / 80f);
        float cell = Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows);
        int bw = Math.max(1, Math.round(cols * cell + gap * (cols - 1)));
        int bh = Math.max(1, Math.round(rows * cell + gap * (rows - 1)));
        Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.RGB_565);
        Canvas c = new Canvas(bmp);
        c.drawColor(BG);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setColor(LINE);
        ring.setStrokeWidth(Math.max(1f, cell * 0.12f));
        float r = cell * 0.22f;
        for (int i = 0; i < years; i++) {
            float x = (i % cols) * (cell + gap), y = (i / cols) * (cell + gap);
            RectF rect = new RectF(x, y, x + cell, y + cell);
            if (i < age) { fill.setColor(LIVED); c.drawRoundRect(rect, r, r, fill); }
            else if (i == age) { fill.setColor(NOW); c.drawRoundRect(rect, r, r, fill); }
            else {
                float s = ring.getStrokeWidth() / 2;
                c.drawRoundRect(new RectF(x + s, y + s, x + cell - s, y + cell - s), r, r, ring);
            }
        }
        return bmp;
    }

    /** 一格一週，每列一年。 */
    private static Bitmap weeksGrid(int w, int h, int rows, int age, int weekInYear) {
        int cols = 52;
        float gx = w >= 300 ? 1f : 0.5f;
        float gy = h / (float) rows >= 4 ? 1f : 0f;
        float cw = (w - gx * (cols - 1)) / cols;
        float ch = (h - gy * (rows - 1)) / rows;
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.RGB_565);
        Canvas c = new Canvas(bmp);
        c.drawColor(BG);
        Paint p = new Paint();
        for (int r = 0; r < rows; r++) {
            for (int k = 0; k < cols; k++) {
                boolean lived = r < age || (r == age && k < weekInYear);
                boolean cur = r == age && k == weekInYear;
                p.setColor(cur ? NOW : lived ? LIVED : LINE);
                float x = k * (cw + gx), y = r * (ch + gy);
                c.drawRect(x, y, x + cw, y + ch, p);
            }
        }
        return bmp;
    }
}
