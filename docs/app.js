(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  };

  /* ---------- 日期工具 ---------- */
  const DAY = 864e5;
  const dn = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
  const parseISO = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? new Date(+m[1], +m[2]-1, +m[3]) : null; };
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const daysIn = d => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  function addMonths(b, n){ const d = new Date(b.getFullYear(), b.getMonth()+n, 1); d.setDate(Math.min(b.getDate(), daysIn(d))); return d; }
  const addYears = (b, n) => addMonths(b, n*12);
  function fullYears(b, d){ let y = d.getFullYear() - b.getFullYear(); if (dn(addYears(b, y)) > dn(d)) y--; return y; }
  function fullMonths(b, d){ let m = (d.getFullYear()-b.getFullYear())*12 + d.getMonth() - b.getMonth(); if (dn(addMonths(b, m)) > dn(d)) m--; return m; }
  const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const weekKey = d => iso(addDays(d, -((d.getDay() + 6) % 7)));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clampInt = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };

  /* ---------- 文字 ---------- */
  const I18N = {
    zh: {
      appName:'一生日歷', birth:'生日', life:'預期壽命（歲）',
      theme_system:'主題：跟隨系統', theme_light:'主題：淺色', theme_dark:'主題：深色', langBtn:'English',
      example:'目前顯示的是示例生日 1996 年 5 月 20 日，下面標著「示例」的內容也都是示範。在上方填入你的生日，格子就會換成你的一生。',
      heroTitle:'這是你人生的第 <b>{n}</b> 週',
      heroSub:'你已經走過 <span class="num">{days}</span> 天，約佔 {life} 年的 <span class="num">{pct}</span>。前方大約還有 <span class="num">{weeks}</span> 週。',
      heroOver:'你已經走過 <span class="num">{days}</span> 天，超過了設定的 {life} 歲。往後的每一格都是多出來的。',
      v_week:'週', v_month:'月', v_year:'年', v_days:'今年', v_wall:'彩繪牆',
      lg_lived:'已度過', lg_now:'此刻', lg_ahead:'還在前方', lg_ms:'里程碑', lg_target:'願望與倒數', lg_review:'有回顧的週',
      showStages:'階段上色', wallAll:'顯示整個人生',
      hint_week:'每一列是一年，每一格是一週。', hint_month:'每一列是五年，每一小段是一年，每一格是一個月。',
      hint_year:'每一列是十年，每一格是一年，格子裡是那一年的歲數。',
      hint_days:'{y} 年的每一天。直的一欄是一週，從週一排到週日。今年還剩 {n} 天。',
      hint_wall:'每一塊磁磚是你走過的一週。寫下回顧，選一個顏色和圖樣，這面牆就會慢慢變成你自己的樣子。目前有 {n} 塊磁磚。',
      clickHint:'點一下任何一格，看看那是哪段日子。',
      cellWeek:'{age} 歲 · 第 {w} 週', cellMonth:'{age} 歲 · 第 {m} 個月', cellYear:'{age} 歲這一年',
      tagLived:'已度過', tagNow:'就是現在', tagAhead:'還在前方',
      addMsHere:'在這一格加入里程碑', makeTile:'做這週的磁磚', editTile:'編輯這週的磁磚',
      i_ms:'里程碑', i_intent:'本週想做', i_cd:'倒數', i_bk:'願望', i_rv:'回顧', i_bday:'生日',
      now:'此刻', todayLeft:'今天還剩下這麼多', barDay:'今天', barWeek:'本週', barYear:'{y} 年', barLife:'一生',
      nextCd:'離「{name}」還有 {n} 天', nextCdToday:'「{name}」就是今天',
      intentTitle:'這一週，我想好好做的一件事', intentPh:'例如：週六帶媽媽去吃早午餐', saved:'已記下', pastWeek:'{md} 那週',
      twEmpty:'這週還沒有磁磚。寫下這週最好的一件事，做出屬於這一週的磁磚。',
      convTitle:'如果活到預期的歲數，前方大約還有',
      c_weekends:'個週末', c_sunrises:'次日出', c_moons:'次滿月', c_terms:'個節氣', c_lny:'次春節', c_bday:'天後是下一個生日',
      add:'加入', del:'刪除',
      p_people:'和重要的人的時間', p_peopleDesc:'你們都還有很多年，但見面的次數其實有限。',
      pName:'名字', pYear:'出生年', pFreq:'多久見一次', pNamePh:'例如：媽媽',
      f365:'住在一起', f52:'每週', f12:'每月', f4:'每季', f2:'每年兩次', f1:'每年一次',
      pLine:'{age} 歲 · {freq}。如果都活到 {life} 歲，大約還能一起過 <b>{lny}</b> 次春節，見 <b>{meet}</b> 次面。',
      pBeyond:'{age} 歲 · 已經超過預期的 {life} 歲，每一次見面都是多出來的。',
      pDot1:'每一點是一次見面', pDotK:'每一點是 {k} 次見面',
      pEmpty:'加入家人或朋友，看看還能見幾次面。',
      p_stages:'人生階段', p_stagesDesc:'替人生分段，打開「階段上色」後，格子會依階段換顏色。',
      sName:'階段名稱', sFrom:'從幾歲', sTo:'到幾歲', sColor:'顏色', sRange:'{a}–{b} 歲', sPreset:'套用常見階段',
      sEmpty:'還沒有任何階段。', stChild:'童年', stSchool:'求學', stWork:'工作', stRetire:'退休',
      p_bucket:'人生願望清單', bText:'想做的事', bAge:'希望幾歲前完成', bTextPh:'例如：去看一次極光',
      bLine:'{age} 歲前 · 還有 {w} 週', bPast:'已經過了 {age} 歲', bDone:'{d} 完成', bProgress:'完成 {d} / {n}',
      bEmpty:'寫下一件這輩子想做的事，它會出現在未來的格子上。', bToggle:'標記為完成',
      p_cd:'重要日子倒數', cdName:'名稱', cdDate:'日期', cdNamePh:'例如：去京都',
      cdLine:'還有 <b>{d}</b> 天 · 約 {w} 週', cdToday:'就是今天', cdPast:'已經過了 {d} 天',
      cdEmpty:'旅行、考試、紀念日……加入一個你在等的日子。',
      p_ms:'里程碑', msDate:'里程碑日期', msText:'里程碑名稱', msPh:'畢業、搬家、相遇……',
      msEmpty:'加入畢業、搬家、認識重要的人這些日子，它們會在格子上亮起來。',
      p_data:'資料與備份', p_dataDesc:'所有資料只存在這個瀏覽器裡。換手機、換電腦或清除瀏覽器資料之前，先下載一份備份。',
      exportBtn:'下載備份檔', copyBtn:'複製備份文字', copied:'已複製到剪貼簿', copyFail:'無法自動複製，下面的文字已經選取好，請手動複製。',
      importTitle:'從備份還原', importFile:'選擇備份檔', importPaste:'或貼上備份文字', importCheck:'檢查這份備份',
      importSummary:'這份備份有 {r} 則回顧、{m} 個里程碑、{p} 位重要的人、{b} 個願望、{c} 個倒數。匯入會取代這個瀏覽器裡目前的資料。',
      importConfirm:'確認匯入', importCancel:'取消', importDone:'匯入完成。', importBad:'這不是一生日歷的備份，請確認選對了檔案或貼上了完整的文字。',
      lastBackup:'上次備份：{d}', neverBackup:'還沒有備份過。', neverBackupNudge:'還沒有備份過，建議先下載一份。', backupNudge:'已經超過 30 天沒有備份了，建議下載一份新的備份。',
      p_phone:'手機', installBtn:'加到主畫面', installed:'已經加到主畫面了。',
      installIos:'iPhone：用 Safari 打開這個網站，點下方的「分享」，再點「加入主畫面」。',
      installAndroid:'Android：用 Chrome 打開這個網站，點右上角的選單，再點「加到主畫面」或「安裝應用程式」。',
      installOffline:'加到主畫面之後，沒有網路也能打開。', widgetLink:'設定手機桌面小工具',
      footer:'生日、回顧和所有記錄只存在這個瀏覽器裡，不會上傳到任何地方。', footerApp:'生日、回顧和所有記錄只存在這支手機裡，不會上傳到任何地方。', privacy:'隱私權政策',
      gridLabel:'一生的格子。用方向鍵移動，按 Enter 打開這一格。', prevCell:'上一格', nextCell:'下一格',
      undo:'復原', deleted:'已刪除「{name}」', tileDeleted:'已刪除這週的磁磚',
      iosStorage:'iPhone 提醒：Safari 可能會清掉 7 天沒打開的網站資料，建議加到主畫面使用。Safari 和主畫面裡的資料是分開的；如果已經在 Safari 記錄了一段時間，先在下面的「資料與備份」下載備份檔，再從主畫面打開後匯入。',
      remindTitle:'每週提醒', remindDesc:'固定一個時間回顧這一週，做這週的磁磚。', remindDay:'星期', remindTime:'時間',
      remindGcal:'加到 Google 日曆', remindIcs:'下載行事曆檔（.ics）', remindOn:'開啟每週提醒', remindOff:'關閉每週提醒',
      remindSet:'已開啟：每{day} {time} 提醒你。', remindNone:'目前沒有開啟提醒。', remindDenied:'沒有通知權限。請到手機的設定裡，允許「一生日歷」傳送通知。',
      remindEvt:'一生日歷：回顧這一週', remindBody:'寫下這週最好的一件事，做出這週的磁磚，再想想下週想好好做的一件事。',
      widgetTitle:'桌面小工具', widgetAdd:'把小工具加到主畫面', widgetHelp:'也可以長按主畫面空白處，點「小工具」，找到「一生日歷」。',
      widgetUnsupported:'這支手機不支援直接加入。請長按主畫面空白處，點「小工具」，找到「一生日歷」。', exportShare:'匯出備份檔',
      weekdayNames:'星期日,星期一,星期二,星期三,星期四,星期五,星期六',
      edTitle:'{range} 這一週', edText:'這週最好的一件事', edPh:'例如：和老朋友聊到半夜', edMood:'這週的代表色（格子很小時顯示這個顏色）', edPattern:'圖樣',
      edDraw:'點或拖曳格子作畫；選油漆桶可以把一整片換成同一個顏色。', edAuto:'依文字生成', edAutoHint:'會依這週寫的內容挑圖案，每按一次換一種構圖。', edFound:'配到的圖案：{names}', edNotFound:'沒有找到對應的圖案，先用抽象圖。可以從下面的「圖案」挑一個貼上。', edClear:'清空',
      edPalette:'顏色', edPen:'畫筆', edFill:'油漆桶', edUndo:'上一步', edBg:'背景圖樣', edMotif:'圖案（點一下貼到中間）',
      zoomIn:'放大格子', zoomOut:'縮小格子', zoomHint:'放大之後，寫過回顧的週會直接顯示那塊磁磚。',
      pt_rings:'同心圓', pt_gradient:'漸層',
      edSave:'儲存磁磚', edCancel:'取消', edDelete:'刪除這塊磁磚', edDeleteConfirm:'再按一次確定刪除', edClose:'關閉',
      exampleTag:'（示例）',
      m_sun:'開心', m_sky:'平靜', m_rose:'感恩', m_leaf:'成長', m_coral:'熱烈', m_slate:'疲累', m_indigo:'低落', m_violet:'興奮', m_brown:'溫暖', m_teal:'自由',
      pt_dots:'圓點', pt_stripes:'斜紋', pt_waves:'波浪', pt_checks:'格紋', pt_diamond:'菱形', pt_flower:'花', pt_star:'星星', pt_heart:'愛心', pt_mountain:'山', pt_sun:'太陽',
      weekdays:'日一二三四五六', months:'1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月'
    },
    en: {
      appName:'Life Calendar', birth:'Birthday', life:'Life expectancy',
      theme_system:'Theme: System', theme_light:'Theme: Light', theme_dark:'Theme: Dark', langBtn:'中文',
      example:'You are looking at an example birthday (May 20, 1996), and anything marked "example" is a sample. Enter your birthday above and the grid becomes your life.',
      heroTitle:'This is week <b>{n}</b> of your life',
      heroSub:'You have lived <span class="num">{days}</span> days, about <span class="num">{pct}</span> of {life} years. Roughly <span class="num">{weeks}</span> weeks lie ahead.',
      heroOver:'You have lived <span class="num">{days}</span> days, past the {life} years you set. Every week from here is extra.',
      v_week:'Weeks', v_month:'Months', v_year:'Years', v_days:'This year', v_wall:'Mosaic',
      lg_lived:'Lived', lg_now:'Now', lg_ahead:'Ahead', lg_ms:'Milestone', lg_target:'Goals & countdowns', lg_review:'Reviewed week',
      showStages:'Color by stage', wallAll:'Show my whole life',
      hint_week:'Each row is a year. Each square is a week.', hint_month:'Each row is five years, each block is a year, and each square is a month.',
      hint_year:'Each row is a decade. Each square is a year, labeled with your age.',
      hint_days:'Every day of {y}. Each column is a week, Monday at the top. {n} days left this year.',
      hint_wall:'Each tile is a week you have lived. Write a review and pick a color and pattern, and the wall slowly becomes yours. {n} tiles so far.',
      clickHint:'Tap any square to see when it was.',
      cellWeek:'Age {age} · week {w}', cellMonth:'Age {age} · month {m}', cellYear:'The year you were {age}',
      tagLived:'Lived', tagNow:'Right now', tagAhead:'Ahead',
      addMsHere:'Add a milestone here', makeTile:"Make this week's tile", editTile:"Edit this week's tile",
      i_ms:'Milestone', i_intent:'Intention', i_cd:'Countdown', i_bk:'Goal', i_rv:'Review', i_bday:'Birthday',
      now:'Right now', todayLeft:'left in today', barDay:'Today', barWeek:'This week', barYear:'{y}', barLife:'Life',
      nextCd:'{n} days until "{name}"', nextCdToday:'"{name}" is today',
      intentTitle:'One thing I want to do well this week', intentPh:'e.g. Take Mom to brunch on Saturday', saved:'Saved', pastWeek:'Week of {md}',
      twEmpty:'No tile for this week yet. Write down the best thing that happened and make a tile for it.',
      convTitle:'If you live to your expected age, roughly ahead of you',
      c_weekends:'weekends', c_sunrises:'sunrises', c_moons:'full moons', c_terms:'solar terms', c_lny:'Lunar New Years', c_bday:'days to your next birthday',
      add:'Add', del:'Delete',
      p_people:'Time with the people who matter', p_peopleDesc:'You both have years ahead, but the number of times you will meet is limited.',
      pName:'Name', pYear:'Birth year', pFreq:'How often you meet', pNamePh:'e.g. Mom',
      f365:'Live together', f52:'Weekly', f12:'Monthly', f4:'Quarterly', f2:'Twice a year', f1:'Once a year',
      pLine:'Age {age} · {freq}. If you both live to {life}: about <b>{lny}</b> more Lunar New Years together and <b>{meet}</b> more visits.',
      pBeyond:'Age {age} · already past {life}. Every visit from here is extra.',
      pDot1:'Each dot is one visit', pDotK:'Each dot is {k} visits',
      pEmpty:'Add family or friends to see how many visits remain.',
      p_stages:'Life stages', p_stagesDesc:'Divide your life into stages. Turn on "Color by stage" to tint the grid.',
      sName:'Stage', sFrom:'From age', sTo:'To age', sColor:'Color', sRange:'Age {a}–{b}', sPreset:'Use common stages',
      sEmpty:'No stages yet.', stChild:'Childhood', stSchool:'School', stWork:'Work', stRetire:'Retirement',
      p_bucket:'Bucket list', bText:'Something to do', bAge:'By age', bTextPh:'e.g. See the northern lights',
      bLine:'By {age} · {w} weeks left', bPast:'Past age {age}', bDone:'Done {d}', bProgress:'{d} of {n} done',
      bEmpty:'Write down something you want to do in this life. It will appear on a future square.', bToggle:'Mark as done',
      p_cd:'Countdowns', cdName:'Name', cdDate:'Date', cdNamePh:'e.g. Trip to Kyoto',
      cdLine:'<b>{d}</b> days · about {w} weeks', cdToday:'Today', cdPast:'{d} days ago',
      cdEmpty:'A trip, an exam, an anniversary. Add a day you are looking forward to.',
      p_ms:'Milestones', msDate:'Milestone date', msText:'Milestone name', msPh:'Graduation, a move, meeting someone',
      msEmpty:'Add days like graduating, moving, or meeting someone important. They will light up on the grid.',
      p_data:'Data & backup', p_dataDesc:'Everything is stored only in this browser. Download a backup before switching phones or computers, or clearing browser data.',
      exportBtn:'Download backup', copyBtn:'Copy backup text', copied:'Copied to clipboard', copyFail:'Could not copy automatically. The text below is selected; copy it by hand.',
      importTitle:'Restore from a backup', importFile:'Choose a backup file', importPaste:'Or paste backup text', importCheck:'Check this backup',
      importSummary:'This backup has {r} reviews, {m} milestones, {p} people, {b} goals and {c} countdowns. Importing replaces the data currently in this browser.',
      importConfirm:'Import and replace', importCancel:'Cancel', importDone:'Imported.', importBad:'This is not a Life Calendar backup. Check that you chose the right file or pasted all of the text.',
      lastBackup:'Last backup: {d}', neverBackup:'No backup yet.', neverBackupNudge:'No backup yet. Consider downloading one now.', backupNudge:'It has been more than 30 days since your last backup. Consider downloading a new one.',
      p_phone:'On your phone', installBtn:'Add to home screen', installed:'Added to your home screen.',
      installIos:'iPhone: open this site in Safari, tap Share, then Add to Home Screen.',
      installAndroid:'Android: open this site in Chrome, tap the menu in the top right, then Add to Home screen or Install app.',
      installOffline:'Once it is on your home screen, it opens even without a connection.', widgetLink:'Set up a home-screen widget',
      footer:'Your birthday, reviews and everything else stay in this browser. Nothing is uploaded.', footerApp:'Your birthday, reviews and everything else stay on this phone. Nothing is uploaded.', privacy:'Privacy policy',
      gridLabel:'Your life grid. Use the arrow keys to move and Enter to open a square.', prevCell:'Previous square', nextCell:'Next square',
      undo:'Undo', deleted:'Deleted "{name}"', tileDeleted:"Deleted this week's tile",
      iosStorage:'iPhone note: Safari may clear data for sites you have not opened in 7 days, so add this site to your home screen. Safari and the home-screen app keep separate data. If you have been using it in Safari, download a backup under Data & backup first, then import it after opening from the home screen.',
      remindTitle:'Weekly reminder', remindDesc:"Pick a regular time to look back on the week and make this week's tile.", remindDay:'Day', remindTime:'Time',
      remindGcal:'Add to Google Calendar', remindIcs:'Download calendar file (.ics)', remindOn:'Turn on weekly reminder', remindOff:'Turn off weekly reminder',
      remindSet:'On: every {day} at {time}.', remindNone:'No reminder set.', remindDenied:'Notifications are not allowed. Allow notifications for Life Calendar in your phone settings.',
      remindEvt:'Life Calendar: look back on this week', remindBody:"Write down the best thing this week, make this week's tile, and pick one thing to do well next week.",
      widgetTitle:'Home-screen widget', widgetAdd:'Add the widget to your home screen', widgetHelp:'You can also long-press an empty spot on your home screen, tap Widgets, and find Life Calendar.',
      widgetUnsupported:'This phone cannot add it directly. Long-press an empty spot on your home screen, tap Widgets, and find Life Calendar.', exportShare:'Export backup',
      weekdayNames:'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
      edTitle:'Week of {range}', edText:'Best thing this week', edPh:'e.g. Talked with an old friend until midnight', edMood:"This week's color (shown when squares are tiny)", edPattern:'Pattern',
      edDraw:'Tap or drag to draw. Use Fill to recolor a whole area at once.', edAuto:'Generate from text', edAutoHint:'Picks a picture from what you wrote. Each tap tries a new composition.', edFound:'Matched: {names}', edNotFound:'No matching picture, so this is an abstract one. You can pick a picture below and place it.', edClear:'Clear',
      edPalette:'Colors', edPen:'Pen', edFill:'Fill', edUndo:'Undo', edBg:'Backgrounds', edMotif:'Pictures (tap to place in the middle)',
      zoomIn:'Zoom in', zoomOut:'Zoom out', zoomHint:'Zoom in and reviewed weeks show their tiles.',
      pt_rings:'Rings', pt_gradient:'Gradient',
      edSave:'Save tile', edCancel:'Cancel', edDelete:'Delete this tile', edDeleteConfirm:'Tap again to delete', edClose:'Close',
      exampleTag:' (example)',
      m_sun:'Happy', m_sky:'Calm', m_rose:'Grateful', m_leaf:'Growing', m_coral:'Fired up', m_slate:'Tired', m_indigo:'Low', m_violet:'Excited', m_brown:'Warm', m_teal:'Free',
      pt_dots:'Dots', pt_stripes:'Stripes', pt_waves:'Waves', pt_checks:'Checks', pt_diamond:'Diamond', pt_flower:'Flower', pt_star:'Star', pt_heart:'Heart', pt_mountain:'Mountains', pt_sun:'Sun',
      weekdays:'SMTWTFS', months:'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'
    }
  };
  const REFLECT = {
    zh: ['今天不會再來第二次。','你正在過的這一週，是整張格子上唯一發光的那一格。','不必把每一格填滿，只要記得自己在哪裡。','和重要的人吃一頓飯，比延後的計畫更值得。','慢慢來，但不要等。','前方的格子很多，但每一格都只能用一次。','留一點時間給沒有目的的散步。','今天做一件讓下週的自己感謝的小事。','把「改天」換成一個日期。','走過的格子都算數，包括那些看起來平凡的。','打一通電話給很久沒聯絡的人。','少滑一次手機，多看一次天色。','今天的你，是往後所有日子裡最年輕的你。','先做真正在乎的事，再處理緊急的事。'],
    en: ["Today won't come twice.","The week you are living now is the only square on the grid that glows.","You don't have to fill every square. Just remember where you are.","A meal with someone you love beats a postponed plan.","Go slowly, but don't wait.","There are many squares ahead, and each one can be used only once.","Leave some time for a walk with no purpose.","Do one small thing today that next week's you will thank you for.","Replace \"someday\" with a date.","Every square you have lived counts, even the ordinary ones.","Call someone you haven't talked to in a while.","Scroll a little less. Look at the sky a little more.","Today you are the youngest you will ever be again.","Do what you care about before what feels urgent."]
  };
  const EX_REVIEWS = {
    zh: ['和老朋友聊到半夜','第一次自己做出好吃的咖哩','週末去山上走了一圈','終於把拖很久的報告交出去','跟家人視訊了一個小時','在書店待了整個下午','學會了一首新歌','早起看了日出'],
    en: ['Talked with an old friend until midnight','Cooked a good curry for the first time','Hiked up the hill on the weekend','Finally handed in the report I kept putting off','Video-called my family for an hour','Spent a whole afternoon in a bookstore','Learned a new song','Woke up early for the sunrise']
  };

  const prefs = Object.assign({
    view: 'week', theme: 'system', wallAll: false, lastBackup: null, zoom: 1, remind: {day: 0, time: '21:00', on: false},
    lang: /^zh/i.test(navigator.language || 'zh') ? 'zh' : 'en'
  }, store.get('lc.prefs', {}));
  if (!['zh','en'].includes(prefs.lang)) prefs.lang = 'zh';
  if (!['week','month','year','days','wall'].includes(prefs.view)) prefs.view = 'week';
  if (!['system','light','dark'].includes(prefs.theme)) prefs.theme = 'system';
  if (!prefs.remind || typeof prefs.remind !== 'object') prefs.remind = {day: 0, time: '21:00', on: false};
  const savePrefs = () => store.set('lc.prefs', prefs);

  function t(key, vars){
    let s = I18N[prefs.lang][key];
    if (s == null) s = I18N.zh[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m);
    return s;
  }
  const nf = n => Math.round(n).toLocaleString(prefs.lang === 'zh' ? 'zh-TW' : 'en-US');
  const fmtDate = d => prefs.lang === 'zh' ? `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}` : d.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
  const fmtMD = d => prefs.lang === 'zh' ? `${d.getMonth()+1}/${d.getDate()}` : d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
  function fmtLong(d){
    if (prefs.lang === 'zh') return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${t('weekdays')[d.getDay()]}`;
    return d.toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  }
  const CN = ['','一','二','三','四','五','六','七','八','九','十'];
  function cnDay(d){ if (d <= 10) return '初' + CN[d]; if (d < 20) return '十' + CN[d-10]; if (d === 20) return '二十'; if (d < 30) return '廿' + CN[d-20]; return '三十'; }
  function cnMonth(n){ return n === 1 ? '正' : n <= 10 ? CN[n] : n === 11 ? '冬' : '臘'; }
  function lunar(d, withYear){
    if (prefs.lang !== 'zh') return '';
    try{
      const parts = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', {year:'numeric', month:'long', day:'numeric'}).formatToParts(d);
      const get = k => (parts.find(p => p.type === k) || {}).value;
      let yn = get('yearName') || '';
      // Android 的 WebView 沒有中文曆法名稱，會回傳「bing-wu」「M09」「M06L」這種格式
      if (!/[\u4e00-\u9fff]/.test(yn)){
        const ry = parseInt(get('relatedYear'), 10);
        yn = ry ? '甲乙丙丁戊己庚辛壬癸'[((ry - 4) % 10 + 10) % 10] + '子丑寅卯辰巳午未申酉戌亥'[((ry - 4) % 12 + 12) % 12] : '';
      }
      let mo = get('month') || '';
      const day = parseInt(get('day'), 10);
      if (!mo || !day) return '';
      const num = mo.match(/^(閏)?M?(\d+)(L)?/);
      if (num) mo = (num[1] || num[3] ? '閏' : '') + cnMonth(+num[2]) + '月';
      return `農曆${withYear && yn ? yn + '年' : ''}${mo}${cnDay(day)}`;
    }catch(e){ return ''; }
  }

  /* ---------- 顏色與圖樣 ---------- */
  const MOODS = {
    sun:{c:'#E3A12F', t:'#FBEBC6'}, sky:{c:'#4F86C6', t:'#DCE8F6'}, rose:{c:'#D46A86', t:'#F8DCE4'},
    leaf:{c:'#3F9466', t:'#D5EEDD'}, coral:{c:'#DD5A38', t:'#FAD8CD'}, slate:{c:'#758097', t:'#E2E5EC'},
    indigo:{c:'#4A4E9E', t:'#DCDCF1'}, violet:{c:'#9558C2', t:'#ECDCF6'}, brown:{c:'#A8703C', t:'#F1E0CE'},
    teal:{c:'#22918F', t:'#D0EDEC'}
  };
  const MOOD_KEYS = Object.keys(MOODS);
  const STAGE_COLORS = ['#7B9BD1','#E0A57E','#D58FA9','#9C8BD3','#5FAFB8','#C2A26A','#A2AE5E','#8E9AAF'];
  function hashStr(s){ let h = 2166136261 >>> 0; for (const ch of String(s)){ h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  const T = window.LCTiles;
  // 調色盤編號 → 這週的代表色（格子太小看不到圖時用）
  const PAL_MOOD = ['slate','slate','coral','coral','sun','leaf','sky','violet','rose','brown'];
  const moodFor = art => PAL_MOOD[T.dominant(art)] || 'sky';
  const artURL = s => T.url(s);
  const ZOOMS = [1, 2, 3, 4, 6];

  /* ---------- 資料 ---------- */
  const EXAMPLE_BIRTH = '1996-05-20';
  const arr = v => Array.isArray(v) ? v : [];
  const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  function normalize(d){
    d = obj(d);
    const thisYear = new Date().getFullYear();
    const out = { version: 2 };
    out.birth = parseISO(d.birth) ? d.birth : null;
    out.life = clampInt(d.life, 40, 120, 80);
    out.milestones = arr(d.milestones).filter(m => m && parseISO(m.d) && m.t).map(m => ({id: String(m.id || uid()), d: m.d, t: String(m.t).slice(0, 60)}));
    out.intents = {};
    Object.entries(obj(d.intents)).forEach(([k, v]) => { if (parseISO(k) && typeof v === 'string' && v.trim()) out.intents[k] = v.slice(0, 120); });
    out.reviews = {};
    Object.entries(obj(d.reviews)).forEach(([k, r]) => {
      if (!parseISO(k) || !r || typeof r !== 'object') return;
      let art = T.fromStr(r.art);
      const legacy = MOODS[r.color] ? MOODS[r.color] : MOODS.sky;
      if (!art && /^[01]{81}$/.test(r.px || '')) art = T.fromLegacy(r.px, legacy.c, legacy.t);
      if (!art) art = T.generate(r.text || k, 0);
      out.reviews[k] = { text: String(r.text || '').slice(0, 200), color: MOODS[r.color] ? r.color : moodFor(art), art: T.toStr(art) };
    });
    out.stages = Array.isArray(d.stages) ? d.stages.filter(s => s && s.name).map(s => ({
      id: String(s.id || uid()), name: String(s.name).slice(0, 20),
      from: clampInt(s.from, 0, 130, 0), to: clampInt(s.to, 0, 130, 0),
      color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : STAGE_COLORS[0]
    })).filter(s => s.to > s.from) : null;
    out.stagesOn = !!d.stagesOn;
    out.people = arr(d.people).filter(p => p && p.name).map(p => ({
      id: String(p.id || uid()), name: String(p.name).slice(0, 30),
      year: clampInt(p.year, 1900, thisYear, thisYear - 60), per: clampInt(p.per, 1, 365, 12)
    }));
    out.bucket = arr(d.bucket).filter(b => b && b.text).map(b => ({
      id: String(b.id || uid()), text: String(b.text).slice(0, 80), age: clampInt(b.age, 1, 130, 60),
      done: !!b.done, doneAt: parseISO(b.doneAt) ? b.doneAt : null
    }));
    out.countdowns = arr(d.countdowns).filter(c => c && c.name && parseISO(c.d)).map(c => ({id: String(c.id || uid()), name: String(c.name).slice(0, 40), d: c.d}));
    return out;
  }
  function defaultStages(){
    return [
      {id: uid(), name: t('stChild'), from: 0, to: 6, color: STAGE_COLORS[0]},
      {id: uid(), name: t('stSchool'), from: 6, to: 22, color: STAGE_COLORS[2]},
      {id: uid(), name: t('stWork'), from: 22, to: 65, color: STAGE_COLORS[5]},
      {id: uid(), name: t('stRetire'), from: 65, to: 120, color: STAGE_COLORS[3]}
    ];
  }
  function loadData(){
    let d = store.get('lc.data', null);
    if (!d){
      d = { birth: store.get('lc.birth', null), life: store.get('lc.life', 80), milestones: store.get('lc.ms', []), intents: store.get('lc.intents', {}) };
      const v = store.get('lc.view', null);
      if (['week','month','year'].includes(v)) prefs.view = v;
    }
    const out = normalize(d);
    if (!out.stages) out.stages = defaultStages();
    return out;
  }
  const hadStoredData = store.get('lc.data', null) != null;
  let data = loadData();
  /* ---------- 原生 App（Capacitor） ---------- */
  const Cap = window.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const pluginCache = {};
  const plugin = name => {
    if (!isNative || !Cap.registerPlugin) return null;
    if (!(name in pluginCache)) pluginCache[name] = Cap.isPluginAvailable(name) ? Cap.registerPlugin(name) : null;
    return pluginCache[name];
  };
  const native = {
    sync(){
      if (!isNative) return;
      const pref = plugin('Preferences');
      if (pref) pref.set({key: 'lc.data', value: JSON.stringify(data)}).catch(() => {});
      const w = plugin('LifeWidget');
      if (w) w.update({birth: data.birth || '', life: data.life, lang: prefs.lang}).catch(() => {});
    },
    async restore(){
      // 手機系統清掉網頁儲存空間時，從原生儲存還原
      const pref = plugin('Preferences');
      if (!pref || hadStoredData) return false;
      try{
        const r = await pref.get({key: 'lc.data'});
        if (!r || !r.value) return false;
        data = normalize(JSON.parse(r.value));
        if (!data.stages) data.stages = defaultStages();
        store.set('lc.data', data);
        return true;
      }catch(e){ return false; }
    }
  };
  let persistAsked = false;
  const save = () => {
    store.set('lc.data', data);
    native.sync();
    if (!persistAsked && !isNative && navigator.storage && navigator.storage.persist){
      persistAsked = true;
      navigator.storage.persist().catch(() => {});
    }
  };

  const isExample = () => !data.birth;
  const birth = () => parseISO(data.birth) || parseISO(EXAMPLE_BIRTH);
  const exTag = () => t('exampleTag');
  function milestones(){
    if (isExample() && !data.milestones.length){
      const zh = prefs.lang === 'zh';
      return [
        {id:'ex1', d:'2014-09-01', t:(zh ? '上大學' : 'Started university') + exTag(), ex:true},
        {id:'ex2', d:'2018-07-02', t:(zh ? '第一份工作' : 'First job') + exTag(), ex:true},
        {id:'ex3', d:'2023-03-18', t:(zh ? '搬進自己的家' : 'Moved into my own place') + exTag(), ex:true}
      ];
    }
    return data.milestones;
  }
  function reviews(){
    if (isExample() && !Object.keys(data.reviews).length){
      const out = {}, mon = parseISO(weekKey(today()));
      const texts = EX_REVIEWS[prefs.lang];
      [1,2,3,5,6,7,9,11].forEach((back, i) => {
        const k = iso(addDays(mon, -7*back));
        const art = T.generate(texts[i], i % 3);
        out[k] = { text: texts[i] + exTag(), color: moodFor(art), art: T.toStr(art), ex: true };
      });
      return out;
    }
    return data.reviews;
  }
  function people(){
    if (isExample() && !data.people.length){
      return [{id:'exp', name:(prefs.lang === 'zh' ? '媽媽' : 'Mom') + exTag(), year:1968, per:12, ex:true}];
    }
    return data.people;
  }
  function bucket(){
    if (isExample() && !data.bucket.length){
      return [
        {id:'exb1', text:(prefs.lang === 'zh' ? '去看一次極光' : 'See the northern lights') + exTag(), age:35, done:false, ex:true},
        {id:'exb2', text:(prefs.lang === 'zh' ? '學會游泳' : 'Learn to swim') + exTag(), age:30, done:true, doneAt:'2025-08-10', ex:true}
      ];
    }
    return data.bucket;
  }
  function countdowns(){
    if (isExample() && !data.countdowns.length){
      const ny = new Date(today().getFullYear() + 1, 0, 1);
      return [{id:'exc', name:(prefs.lang === 'zh' ? '新年' : "New Year's Day") + exTag(), d: iso(ny), ex:true}];
    }
    return data.countdowns;
  }
  const stageFor = y => data.stagesOn ? data.stages.find(s => y >= s.from && y < s.to) || null : null;

  /* ---------- 格子視圖 ---------- */
  const VIEWS = {
    week: {
      per: 52, yearsPerRow: 1,
      unitOf(b, d){ const y = fullYears(b, d); const w = Math.min(51, Math.floor((dn(d) - dn(addYears(b, y))) / 7)); return y*52 + w; },
      target: age => age*52 - 1,
      range(b, u){
        const y = Math.floor(u/52), w = u % 52;
        const s = addDays(addYears(b, y), w*7);
        const e = w === 51 ? addDays(addYears(b, y+1), -1) : addDays(s, 6);
        return [s, e, t('cellWeek', {age: y, w: w+1})];
      }
    },
    month: {
      per: 12, yearsPerRow: 5,
      unitOf: (b, d) => fullMonths(b, d),
      target: age => age*12 - 1,
      range: (b, u) => [addMonths(b, u), addDays(addMonths(b, u+1), -1), t('cellMonth', {age: Math.floor(u/12), m: u%12 + 1})]
    },
    year: {
      per: 1, yearsPerRow: 10,
      unitOf: (b, d) => fullYears(b, d),
      target: age => age - 1,
      range: (b, u) => [addYears(b, u), addDays(addYears(b, u+1), -1), t('cellYear', {age: u})]
    }
  };
  const state = { sel: null, ed: null, importData: null };

  function lifeMarks(v, b){
    const map = new Map();
    const put = (u, k, item) => { if (!map.has(u)) map.set(u, {}); const m = map.get(u); (m[k] = m[k] || []).push(item); };
    milestones().forEach(m => { const d = parseISO(m.d); if (d && dn(d) >= dn(b)) put(v.unitOf(b, d), 'ms', m); });
    countdowns().forEach(c => { const d = parseISO(c.d); if (d && dn(d) >= dn(b)) put(v.unitOf(b, d), 'cd', c); });
    bucket().forEach(x => put(v.target(x.age), 'bk', x));
    if (v === VIEWS.week){
      Object.entries(reviews()).forEach(([k, r]) => { const th = addDays(parseISO(k), 3); if (dn(th) >= dn(b)) put(v.unitOf(b, th), 'rv', Object.assign({k}, r)); });
    }
    return map;
  }

  function cellClass(lived, isNow, stage, mk, future){
    let fill;
    if (isNow) fill = mk && mk.rv ? 'n r' : 'n';
    else if (lived && mk && mk.rv) fill = 'r';
    else if (mk && mk.ms) fill = 'm';
    else if (lived) fill = stage ? 'ps' : 'p';
    else fill = stage ? 'fs' : 'f';
    let cls = 'c ' + fill;
    if (future && mk && (mk.cd || (mk.bk && mk.bk.some(x => !x.done)))) cls += ' t';
    return cls;
  }

  function renderLife(){
    const b = birth(), td = today(), v = VIEWS[prefs.view];
    const age = Math.max(0, fullYears(b, td));
    const years = Math.max(data.life, age + 1);
    const cur = v.unitOf(b, td);
    const marks = lifeMarks(v, b);
    const rows = Math.ceil(years / v.yearsPerRow);
    let html = '';
    for (let r = 0; r < rows; r++){
      const y0 = r * v.yearsPerRow;
      const label = prefs.view === 'week' ? (y0 % 5 === 0 ? y0 : '') : y0;
      const decade = prefs.view === 'week' && y0 > 0 && y0 % 10 === 0;
      html += `<div class="row${decade ? ' decade' : ''}"><span class="rl">${label}</span><div class="groups" style="--G:${v.yearsPerRow}">`;
      for (let g = 0; g < v.yearsPerRow && y0 + g < years; g++){
        const y = y0 + g, stage = stageFor(y);
        html += `<div class="grp" style="--P:${v.per}">`;
        for (let k = 0; k < v.per; k++){
          const u = y * v.per + k, mk = marks.get(u);
          let cls = cellClass(u < cur, u === cur, stage, mk, u > cur);
          if (y >= data.life && u > cur) cls += ' x';
          if (state.sel === u) cls += ' sel';
          let style = '';
          if (stage) style += `--sc:${stage.color};`;
          if (mk && mk.rv){
            style += `--rc:${MOODS[mk.rv[0].color].c};`;
            if (u <= cur) style += `background-image:url(${artURL(mk.rv[0].art)});`;
          }
          html += `<i class="${cls}" data-u="${u}"${style ? ` style="${style}"` : ''}>${prefs.view === 'year' ? y : ''}</i>`;
        }
        html += '</div>';
      }
      html += '</div></div>';
    }
    $('grid').innerHTML = html;
    $('hint').textContent = t('hint_' + prefs.view) + t('clickHint') + (prefs.view === 'week' ? t('zoomHint') : '');
    renderLifeInfo(state.sel == null ? cur : state.sel);
  }

  function infoHTML(title, s, e, tag, items, actions, art){
    const when = e && dn(e) !== dn(s) ? `${fmtDate(s)} – ${fmtDate(e)}` : fmtDate(s) + (lunar(s) ? ' · ' + lunar(s) : '');
    const tagCls = {lived:'t-p', now:'t-n', ahead:'t-f'}[tag];
    const tagTxt = {lived:t('tagLived'), now:t('tagNow'), ahead:t('tagAhead')}[tag];
    const its = items.map(([k, txt, color]) => `<span class="it"${color ? ` style="--ic:${color}"` : ''}><em>${esc(t('i_' + k))}</em>${esc(txt)}</span>`).join('');
    const acts = actions.map(a => `<button type="button" class="linkbtn" data-act="${a[0]}"${a[2] ? ` data-arg="${esc(a[2])}"` : ''}>${esc(a[1])}</button>`).join('');
    const nav = `<span class="nav"><button type="button" data-nav="-1" aria-label="${esc(t('prevCell'))}">‹</button><button type="button" data-nav="1" aria-label="${esc(t('nextCell'))}">›</button></span>`;
    const body = `<div class="info-top"><strong>${esc(title)}</strong><span class="when">${when}</span><span class="tag ${tagCls}">${tagTxt}</span>${nav}</div>${its ? `<div class="info-items">${its}</div>` : ''}${acts ? `<div class="info-acts">${acts}</div>` : ''}`;
    $('info').innerHTML = art ? `<div class="info-wrap"><i class="info-tile" style="background-image:url(${artURL(art)})"></i><div class="info-body">${body}</div></div>` : body;
  }

  function renderLifeInfo(u){
    const b = birth(), v = VIEWS[prefs.view], cur = v.unitOf(b, today());
    const [s, e, label] = v.range(b, u);
    const mk = lifeMarks(v, b).get(u) || {};
    const items = [];
    (mk.ms || []).forEach(m => items.push(['ms', m.t]));
    (mk.rv || []).forEach(r => items.push(['rv', r.text || '·', MOODS[r.color].c]));
    (mk.cd || []).forEach(c => items.push(['cd', c.name]));
    (mk.bk || []).forEach(x => items.push(['bk', x.text]));
    const actions = [['ms', t('addMsHere'), iso(s)]];
    if (prefs.view === 'week' && u <= cur){
      const k = weekKey(addDays(s, 3));
      actions.unshift(['tile', reviews()[k] && !reviews()[k].ex ? t('editTile') : t('makeTile'), k]);
    }
    infoHTML(label, s, e, u < cur ? 'lived' : u === cur ? 'now' : 'ahead', items, actions, mk.rv && u <= cur ? mk.rv[0].art : null);
  }

  function dayMarks(Y){
    const map = new Map();
    const put = (d, k, item) => { if (d.getFullYear() !== Y) return; const i = dn(d) - dn(new Date(Y, 0, 1)); if (!map.has(i)) map.set(i, {}); const m = map.get(i); (m[k] = m[k] || []).push(item); };
    milestones().forEach(m => put(parseISO(m.d), 'ms', m));
    countdowns().forEach(c => put(parseISO(c.d), 'cd', c));
    const b = birth();
    put(new Date(Y, b.getMonth(), Math.min(b.getDate(), daysIn(new Date(Y, b.getMonth(), 1)))), 'bday', {});
    Object.entries(reviews()).forEach(([k, r]) => { const mon = parseISO(k); for (let i = 0; i < 7; i++) put(addDays(mon, i), 'rv', Object.assign({k}, r)); });
    return map;
  }

  function renderDays(){
    const td = today(), Y = td.getFullYear(), jan1 = new Date(Y, 0, 1);
    const nDays = dn(new Date(Y+1, 0, 1)) - dn(jan1);
    const off = (jan1.getDay() + 6) % 7;
    const cols = Math.ceil((off + nDays) / 7);
    const ti = dn(td) - dn(jan1);
    const marks = dayMarks(Y);
    const months = t('months').split(',');
    let mh = '';
    for (let m = 0; m < 12; m++){ const i = dn(new Date(Y, m, 1)) - dn(jan1); mh += `<span style="grid-column:${Math.floor((i + off) / 7) + 1}">${months[m]}</span>`; }
    let cells = '';
    for (let i = 0; i < off; i++) cells += '<i class="c e"></i>';
    for (let i = 0; i < nDays; i++){
      const mk = marks.get(i);
      const st = data.stagesOn ? stageFor(Math.max(0, fullYears(birth(), addDays(jan1, i)))) : null;
      let cls = cellClass(i < ti, i === ti, st, mk, i > ti);
      if (mk && mk.bday && i > ti) cls += ' t';
      if (state.sel === i) cls += ' sel';
      let style = '';
      if (st) style += `--sc:${st.color};`;
      if (mk && mk.rv) style += `--rc:${MOODS[mk.rv[0].color].c};`;
      cells += `<i class="${cls}" data-d="${i}"${style ? ` style="${style}"` : ''}></i>`;
    }
    const wd = t('weekdays');
    const wk = [1,2,3,4,5,6,0].map((d, r) => `<span>${r % 2 === 0 ? wd[d] : ''}</span>`).join('');
    $('grid').innerHTML = `<div class="days" style="--cols:${cols}"><span></span><div class="dmonths">${mh}</div><div class="dwk">${wk}</div><div class="dgrid">${cells}</div></div>`;
    $('hint').textContent = t('hint_days', {y: Y, n: nDays - ti - 1}) + t('clickHint');
    renderDayInfo(state.sel == null ? ti : state.sel);
  }

  function renderDayInfo(i){
    const td = today(), Y = td.getFullYear(), d = addDays(new Date(Y, 0, 1), i);
    const ti = dn(td) - dn(new Date(Y, 0, 1));
    const mk = dayMarks(Y).get(i) || {};
    const items = [];
    if (mk.bday) items.push(['bday', prefs.lang === 'zh' ? `${Y - birth().getFullYear()} 歲` : `Turning ${Y - birth().getFullYear()}`]);
    (mk.ms || []).forEach(m => items.push(['ms', m.t]));
    (mk.cd || []).forEach(c => items.push(['cd', c.name]));
    if (mk.rv) items.push(['rv', mk.rv[0].text || '·', MOODS[mk.rv[0].color].c]);
    const title = prefs.lang === 'zh' ? `${d.getMonth()+1}月${d.getDate()}日 星期${t('weekdays')[d.getDay()]}` : d.toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric'});
    const actions = [['ms', t('addMsHere'), iso(d)]];
    if (i <= ti && dn(d) >= dn(birth())){ const k = weekKey(d); actions.unshift(['tile', reviews()[k] && !reviews()[k].ex ? t('editTile') : t('makeTile'), k]); }
    infoHTML(title, d, null, i < ti ? 'lived' : i === ti ? 'now' : 'ahead', items, actions, mk.rv ? mk.rv[0].art : null);
  }

  function renderWall(){
    const b = birth(), td = today(), curK = weekKey(td);
    const revs = reviews();
    const keys = Object.keys(revs).sort();
    const ageNow = Math.max(0, fullYears(b, td));
    let firstAge = 0;
    if (!prefs.wallAll){
      const fa = keys.length ? Math.max(0, fullYears(b, addDays(parseISO(keys[0]), 3))) : ageNow;
      firstAge = Math.min(fa, ageNow);
    }
    const groups = new Map();
    for (let mon = parseISO(weekKey(b)); dn(mon) <= dn(td); mon = addDays(mon, 7)){
      const age = Math.max(0, fullYears(b, addDays(mon, 3)));
      if (age < firstAge) continue;
      if (!groups.has(age)) groups.set(age, []);
      groups.get(age).push(iso(mon));
    }
    let html = '', count = 0;
    groups.forEach((ks, age) => {
      html += `<div class="wy"><span class="rl">${age}</span><div class="wt">`;
      ks.forEach(k => {
        const r = revs[k];
        const sel = state.sel === k ? ' sel' : '';
        if (r){ count++; html += `<i class="tile${sel}" data-k="${k}" style="background-image:url(${artURL(r.art)})"></i>`; }
        else if (k === curK) html += `<i class="tile now${sel}" data-k="${k}">+</i>`;
        else html += `<i class="tile blank${sel}" data-k="${k}"></i>`;
      });
      html += '</div></div>';
    });
    $('grid').innerHTML = `<div class="wall">${html}</div>`;
    $('hint').textContent = t('hint_wall', {n: nf(count)});
    renderWallInfo(state.sel == null ? curK : state.sel);
  }

  function renderWallInfo(k){
    const mon = parseISO(k), r = reviews()[k];
    const b = birth(), cur = weekKey(today());
    const age = Math.max(0, fullYears(b, addDays(mon, 3)));
    const title = prefs.lang === 'zh' ? `${age} 歲` : `Age ${age}`;
    const items = r ? [['rv', r.text || '·', MOODS[r.color].c]] : [];
    if (data.intents[k]) items.push(['intent', data.intents[k]]);
    infoHTML(title, mon, addDays(mon, 6), k === cur ? 'now' : 'lived', items, [['tile', r && !r.ex ? t('editTile') : t('makeTile'), k]], r ? r.art : null);
  }

  function renderLegend(){
    const parts = [];
    if (prefs.view === 'wall') return void ($('legend').innerHTML = '');
    parts.push(`<span><i class="lp"></i>${t('lg_lived')}</span>`, `<span><i class="ln"></i>${t('lg_now')}</span>`, `<span><i></i>${t('lg_ahead')}</span>`, `<span><i class="lm"></i>${t('lg_ms')}</span>`, `<span><i class="lt"></i>${t('lg_target')}</span>`);
    if (prefs.view === 'week' || prefs.view === 'days') parts.push(`<span><i class="lr"></i>${t('lg_review')}</span>`);
    if (data.stagesOn) data.stages.forEach(s => parts.push(`<span><i style="background:${s.color};box-shadow:none"></i>${esc(s.name)}</span>`));
    $('legend').innerHTML = parts.join('');
  }

  function renderBoard(){
    document.querySelectorAll('.seg button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.view === prefs.view)));
    $('grid').className = 'grid v-' + prefs.view;
    $('stageToggleWrap').hidden = prefs.view === 'wall';
    $('wallAllWrap').hidden = prefs.view !== 'wall';
    $('stageToggle').checked = data.stagesOn;
    $('wallAll').checked = prefs.wallAll;
    const z = prefs.view === 'week' ? (ZOOMS.includes(prefs.zoom) ? prefs.zoom : 1) : 1;
    $('zoomWrap').hidden = prefs.view !== 'week';
    $('zoomLbl').textContent = z + '×';
    $('zoomOut').disabled = z === ZOOMS[0];
    $('zoomIn').disabled = z === ZOOMS[ZOOMS.length - 1];
    $('grid').style.setProperty('--z', z);
    $('grid').classList.toggle('zoomed', z > 1);
    renderLegend();
    if (prefs.view === 'days') renderDays();
    else if (prefs.view === 'wall') renderWall();
    else renderLife();
  }

  /* ---------- 標題區 ---------- */
  function renderHero(){
    const b = birth(), td = today();
    const death = addYears(b, data.life);
    const livedDays = dn(td) - dn(b);
    const totalDays = dn(death) - dn(b);
    const weekNo = Math.floor(livedDays / 7) + 1;
    const leftDays = dn(death) - dn(td);
    const pct = Math.min(100, livedDays / totalDays * 100);
    $('heroTitle').innerHTML = t('heroTitle', {n: nf(weekNo)});
    $('heroSub').innerHTML = leftDays > 0
      ? t('heroSub', {days: nf(livedDays), life: data.life, pct: pct.toFixed(1) + '%', weeks: nf(totalDays/7 - weekNo + 1)})
      : t('heroOver', {days: nf(livedDays), life: data.life});
    const doy = dn(td) - dn(new Date(td.getFullYear(), 0, 1));
    const list = REFLECT[prefs.lang];
    $('reflect').textContent = list[(doy + td.getFullYear()) % list.length];
    $('exampleNote').hidden = !isExample();
    $('exampleNote').textContent = t('example');

    const leftYears = Math.max(0, leftDays) / 365.2425;
    const nb = addYears(b, fullYears(b, td) + 1);
    const items = [
      [Math.max(0, leftDays) / 7, 'c_weekends'], [Math.max(0, leftDays), 'c_sunrises'], [leftYears * 12.368, 'c_moons'],
      [leftYears * 24, 'c_terms'], [Math.floor(leftYears), 'c_lny'], [dn(nb) - dn(td), 'c_bday']
    ];
    $('conv').innerHTML = items.map(([n, k]) => `<div><b>${nf(n)}</b><span>${t(k)}</span></div>`).join('');
  }

  function renderToday(){
    const d = new Date(), lu = lunar(d, true);
    $('todayLine').textContent = fmtLong(d) + (lu ? ' · ' + lu : '');
  }

  /* ---------- 側欄：本週 ---------- */
  function renderWeekCard(){
    const k = weekKey(today());
    const inp = $('intent');
    if (document.activeElement !== inp) inp.value = data.intents[k] || '';
    const past = Object.keys(data.intents).filter(x => x !== k).sort().reverse().slice(0, 3);
    $('pastIntents').innerHTML = past.map(x => `<li><span class="d">${esc(t('pastWeek', {md: fmtMD(parseISO(x))}))}</span><span>${esc(data.intents[x])}</span></li>`).join('');
    const r = data.reviews[k];
    if (r){
      $('twTile').style.backgroundImage = `url(${artURL(r.art)})`;
      $('twTile').classList.remove('empty');
      $('twText').textContent = r.text || '';
      $('twBtn').textContent = t('editTile');
    } else {
      $('twTile').style.backgroundImage = '';
      $('twTile').classList.add('empty');
      $('twText').textContent = t('twEmpty');
      $('twBtn').textContent = t('makeTile');
    }
  }

  /* ---------- 下方面板 ---------- */
  const FREQS = [365, 52, 12, 4, 2, 1];
  const freqLabel = per => FREQS.includes(per) ? t('f' + per) : (prefs.lang === 'zh' ? `每年 ${per} 次` : `${per} times a year`);
  const delBtn = (kind, id, label) => `<button type="button" class="del" data-del="${kind}" data-id="${esc(id)}" aria-label="${esc(t('del'))} ${esc(label)}">×</button>`;

  function renderPeople(){
    const b = birth(), td = today(), Y = td.getFullYear();
    const myLeft = Math.max(0, (dn(addYears(b, data.life)) - dn(td)) / 365.2425);
    const list = people();
    $('peopleList').innerHTML = list.map(p => {
      const age = Y - p.year;
      const theirLeft = Math.max(0, data.life - age);
      const shared = Math.min(myLeft, theirLeft);
      let body;
      if (theirLeft <= 0) body = `<p class="pl">${t('pBeyond', {age, life: data.life})}</p>`;
      else {
        const meet = Math.round(shared * p.per), lny = Math.floor(shared);
        const k = meet > 360 ? Math.ceil(meet / 360) : 1;
        const n = Math.ceil(meet / k);
        body = `<p class="pl">${t('pLine', {age, freq: freqLabel(p.per), life: data.life, lny: nf(lny), meet: nf(meet)})}</p>
          <div class="dots" aria-hidden="true">${'<i></i>'.repeat(Math.min(n, 360))}</div>
          <p class="note">${k === 1 ? t('pDot1') : t('pDotK', {k})}</p>`;
      }
      return `<li class="person"><div class="lrow"><strong>${esc(p.name)}</strong>${p.ex ? '' : delBtn('people', p.id, p.name)}</div>${body}</li>`;
    }).join('');
    $('peopleEmpty').hidden = list.length > 0;
    $('psFreq').innerHTML = FREQS.map(f => `<option value="${f}"${f === 12 ? ' selected' : ''}>${t('f' + f)}</option>`).join('');
  }

  function renderStages(){
    $('stagesOn').checked = data.stagesOn;
    $('stageList').innerHTML = data.stages.slice().sort((a, b) => a.from - b.from).map(s => `
      <li class="lrow"><button type="button" class="swatch" data-cycle="${esc(s.id)}" style="background:${s.color}" aria-label="${esc(t('sColor'))}"></button>
      <span class="grow">${esc(s.name)}</span><span class="d">${t('sRange', {a: s.from, b: s.to})}</span>${delBtn('stages', s.id, s.name)}</li>`).join('');
    $('stageEmpty').hidden = data.stages.length > 0;
    $('stagePreset').hidden = data.stages.length > 0;
    const sel = $('sColor');
    if (!sel.dataset.ready){
      sel.innerHTML = STAGE_COLORS.map((c, i) => `<label class="swatch" style="background:${c}"><input type="radio" name="sColor" value="${c}"${i === 0 ? ' checked' : ''} aria-label="${c}"></label>`).join('');
      sel.dataset.ready = '1';
    }
  }

  function renderBucket(){
    const b = birth(), td = today();
    const list = bucket().slice().sort((x, y) => (x.done - y.done) || (x.age - y.age));
    $('bucketList').innerHTML = list.map(x => {
      const w = Math.floor((dn(addYears(b, x.age)) - dn(td)) / 7);
      const line = x.done ? t('bDone', {d: x.doneAt ? fmtDate(parseISO(x.doneAt)) : ''}) : w >= 0 ? t('bLine', {age: x.age, w: nf(w)}) : t('bPast', {age: x.age});
      return `<li class="lrow${x.done ? ' done' : ''}"><input type="checkbox" data-done="${esc(x.id)}" ${x.done ? 'checked' : ''} ${x.ex ? 'disabled' : ''} aria-label="${esc(t('bToggle'))}">
        <span class="grow"><span class="bt">${esc(x.text)}</span><span class="d">${line}</span></span>${x.ex ? '' : delBtn('bucket', x.id, x.text)}</li>`;
    }).join('');
    const done = list.filter(x => x.done).length;
    $('bucketProgress').textContent = list.length ? t('bProgress', {d: done, n: list.length}) : '';
    $('bucketEmpty').hidden = list.length > 0;
  }

  function renderCountdowns(){
    const td = today();
    const list = countdowns().slice().sort((a, b) => {
      const da = dn(parseISO(a.d)) - dn(td), db = dn(parseISO(b.d)) - dn(td);
      return (da < 0) - (db < 0) || (da < 0 ? db - da : da - db);
    });
    $('cdList').innerHTML = list.map(c => {
      const d = dn(parseISO(c.d)) - dn(td);
      const line = d > 0 ? t('cdLine', {d: nf(d), w: (d / 7).toFixed(1)}) : d === 0 ? t('cdToday') : t('cdPast', {d: nf(-d)});
      return `<li class="lrow${d < 0 ? ' done' : ''}"><span class="grow"><span class="bt">${esc(c.name)}</span><span class="d">${fmtDate(parseISO(c.d))}</span></span><span class="cdn">${line}</span>${c.ex ? '' : delBtn('countdowns', c.id, c.name)}</li>`;
    }).join('');
    $('cdEmpty').hidden = list.length > 0;
    const next = list.find(c => dn(parseISO(c.d)) >= dn(td));
    if (next){
      const d = dn(parseISO(next.d)) - dn(td);
      $('nextCd').textContent = d === 0 ? t('nextCdToday', {name: next.name}) : t('nextCd', {name: next.name, n: nf(d)});
      $('nextCd').hidden = false;
    } else $('nextCd').hidden = true;
  }

  function renderMs(){
    const list = milestones().slice().sort((a, b) => a.d < b.d ? -1 : 1);
    $('msList').innerHTML = list.map(m => `<li class="lrow"><span class="d">${fmtDate(parseISO(m.d))}</span><span class="grow">${esc(m.t)}</span>${m.ex ? '' : delBtn('milestones', m.id, m.t)}</li>`).join('');
    $('msEmpty').hidden = list.length > 0;
  }

  function renderData(){
    const lb = parseISO(prefs.lastBackup);
    let s = lb ? t('lastBackup', {d: fmtDate(lb)}) : t('neverBackup');
    const hasData = Object.keys(data.reviews).length || data.milestones.length || data.people.length || data.bucket.length || data.countdowns.length || Object.keys(data.intents).length;
    if (hasData && !lb) s = t('neverBackupNudge');
    else if (hasData && dn(today()) - dn(lb) > 30) s += ' ' + t('backupNudge');
    $('backupState').textContent = s;
  }

  let deferredPrompt = null;
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function nextReminder(){
    const [hh, mm] = (prefs.remind.time || '21:00').split(':').map(Number);
    const now = new Date();
    let d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0);
    while (d.getDay() !== prefs.remind.day || d <= now) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, hh || 0, mm || 0);
    return d;
  }
  const stamp = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const BYDAY = ['SU','MO','TU','WE','TH','FR','SA'];
  const SITE = 'https://laithting.github.io/life-calendar/';
  function gcalURL(){
    const s = nextReminder(), e = new Date(s.getTime() + 15*60000);
    let tz = '';
    try{ tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }catch(err){}
    const q = new URLSearchParams({action: 'TEMPLATE', text: t('remindEvt'), details: t('remindBody') + '\n\n' + SITE,
      dates: `${stamp(s)}/${stamp(e)}`, recur: `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[prefs.remind.day]}`});
    if (tz) q.set('ctz', tz);
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }
  function icsText(){
    const s = nextReminder();
    const icsEsc = v => String(v).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const now = new Date();
    const utc = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Life Calendar//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',
      `UID:weekly-review-${now.getTime()}@life-calendar`, `DTSTAMP:${utc}`, `DTSTART:${stamp(s)}`, 'DURATION:PT15M',
      `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[prefs.remind.day]}`, `SUMMARY:${icsEsc(t('remindEvt'))}`,
      `DESCRIPTION:${icsEsc(t('remindBody') + '\n\n' + SITE)}`, `URL:${SITE}`,
      'BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY',`DESCRIPTION:${icsEsc(t('remindEvt'))}`,'END:VALARM',
      'END:VEVENT','END:VCALENDAR',''].join('\r\n');
  }
  function renderPhone(){
    const web = !isNative;
    $('installBtn').hidden = !deferredPrompt;
    $('installedNote').hidden = !(web && standalone());
    $('installHelp').hidden = !web || standalone() || !window.LC_STANDALONE;
    $('iosNote').hidden = !(web && isIOS && !standalone() && window.LC_STANDALONE);
    $('webWidget').hidden = !web;
    $('nativeWidget').hidden = !(isNative && plugin('LifeWidget'));
    const names = t('weekdayNames').split(',');
    $('rDay').innerHTML = names.map((n, i) => `<option value="${i}"${i === prefs.remind.day ? ' selected' : ''}>${n}</option>`).join('');
    $('rTime').value = prefs.remind.time;
    $('remindWeb').hidden = isNative;
    $('icsBtn').hidden = !window.LC_STANDALONE;
    $('gcalLink').href = gcalURL();
    $('remindNative').hidden = !isNative;
    if (isNative){
      $('remindToggle').textContent = prefs.remind.on ? t('remindOff') : t('remindOn');
      const dayName = prefs.lang === 'zh' ? names[prefs.remind.day].replace(/^星期/, '週') : names[prefs.remind.day];
      $('remindMsg').textContent = prefs.remind.on ? t('remindSet', {day: dayName, time: prefs.remind.time}) : t('remindNone');
    }
    $('footerText').textContent = isNative ? t('footerApp') : t('footer');
    $('exportBtn').textContent = isNative ? t('exportShare') : t('exportBtn');
  }
  async function scheduleNative(){
    const ln = plugin('LocalNotifications');
    if (!ln) return false;
    try{
      await ln.cancel({notifications: [{id: 1001}]}).catch(() => {});
      if (!prefs.remind.on) return true;
      let perm = await ln.checkPermissions();
      if (perm.display !== 'granted') perm = await ln.requestPermissions();
      if (perm.display !== 'granted') return false;
      const [hh, mm] = prefs.remind.time.split(':').map(Number);
      await ln.schedule({notifications: [{
        // 週提醒差幾分鐘沒關係，不用精準鬧鐘，Android 也就不會跳去「鬧鐘與提醒」設定頁
        id: 1001, title: t('remindEvt'), body: t('remindBody'), isExactNotification: false,
        schedule: {on: {weekday: prefs.remind.day + 1, hour: hh, minute: mm}, allowWhileIdle: true}
      }]});
      return true;
    }catch(e){ return false; }
  }

  function renderPanels(){ renderPeople(); renderStages(); renderBucket(); renderCountdowns(); renderMs(); renderData(); renderPhone(); }

  /* ---------- 介面文字與主題 ---------- */
  function applyTheme(){
    if (prefs.theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', prefs.theme);
    $('themeBtn').textContent = t('theme_' + prefs.theme);
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
      if (!m.dataset.orig) m.dataset.orig = m.content;
      m.content = prefs.theme === 'system' ? m.dataset.orig : (prefs.theme === 'dark' ? '#0E1325' : '#ECEFF5');
    });
  }
  function applyI18n(){
    document.documentElement.lang = prefs.lang === 'zh' ? 'zh-Hant-TW' : 'en';
    document.title = t('appName');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    $('langBtn').textContent = t('langBtn');
    applyTheme();
  }

  /* ---------- 此刻（每秒） ---------- */
  let lastDay = iso(new Date());
  function tick(){
    const now = new Date();
    if (iso(now) !== lastDay){ lastDay = iso(now); renderAll(); return; }
    const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const left = Math.max(0, Math.floor((DAY - (now - mid)) / 1000));
    $('countdown').innerHTML = `${pad(Math.floor(left/3600))}:${pad(Math.floor(left%3600/60))}:${pad(left%60)}<small>${t('todayLeft')}</small>`;
    const mon = addDays(mid, -((now.getDay() + 6) % 7));
    const y0 = new Date(now.getFullYear(), 0, 1), y1 = new Date(now.getFullYear()+1, 0, 1);
    const b = birth(), death = addYears(b, data.life);
    const set = (id, p, digits) => { p = Math.max(0, Math.min(1, p)); $('p'+id).textContent = (p*100).toFixed(digits) + '%'; $('f'+id).style.width = (p*100).toFixed(3) + '%'; };
    set('Day', (now - mid) / DAY, 1);
    set('Week', (now - mon) / (7*DAY), 1);
    set('Year', (now - y0) / (y1 - y0), 2);
    set('Life', (now - b) / (death - b), 7);
    $('yearLbl').textContent = t('barYear', {y: now.getFullYear()});
  }

  function renderAll(){ applyI18n(); renderToday(); renderHero(); renderBoard(); renderWeekCard(); renderPanels(); tick(); }

  /* ---------- 提示與復原 ---------- */
  let toastTimer, toastUndo = null;
  function toast(msg, undo){
    $('toastMsg').textContent = msg;
    toastUndo = undo || null;
    $('toastUndo').hidden = !undo;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; toastUndo = null; }, 6000);
  }

  /* ---------- 磁磚編輯器 ---------- */
  function openEditor(k){
    const r = data.reviews[k];
    const mon = parseISO(k);
    const art = r ? T.fromStr(r.art) : T.generate(data.intents[k] || k, 0);
    state.ed = {
      k, text: r ? r.text : '', art, color: r ? r.color : moodFor(art), moodTouched: !!r,
      isNew: !r, autoN: 0, brush: 1, tool: 'pen', undo: [], returnTo: document.activeElement
    };
    $('edTitle').textContent = t('edTitle', {range: `${fmtMD(mon)} – ${fmtMD(addDays(mon, 6))}`});
    $('edText').value = state.ed.text;
    $('edAutoMsg').textContent = '';
    $('edDelete').hidden = state.ed.isNew;
    $('edDelete').textContent = t('edDelete');
    $('editor').hidden = false;
    document.body.classList.add('locked');
    $('edPix').innerHTML = Array.from({length: 256}, (_, i) => `<i data-i="${i}"></i>`).join('');
    $('edMotifs').innerHTML = T.MOTIF_KEYS.map(m => {
      const name = T.MOTIFS[m][prefs.lang] || T.MOTIFS[m].zh;
      return `<button type="button" class="pat" data-motif="${m}" title="${esc(name)}" aria-label="${esc(name)}" style="background-image:url(${artURL(T.motifPreview(m))})"></button>`;
    }).join('');
    renderEditor();
    setTimeout(() => $('edText').focus(), 30);
  }
  function closeEditor(){
    $('editor').hidden = true;
    document.body.classList.remove('locked');
    const back = state.ed && state.ed.returnTo;
    state.ed = null;
    if (back && back.focus) back.focus();
  }
  function edSecond(){
    // 背景圖樣的第二個顏色：用畫面左上角的顏色，跟畫筆一樣時改用白或黑
    const ed = state.ed, c = ed.art[0];
    return c !== ed.brush ? c : (ed.brush === 0 ? 1 : 0);
  }
  function renderEditor(){
    const ed = state.ed; if (!ed) return;
    if (!ed.moodTouched) ed.color = moodFor(ed.art);
    paintPix();
    const names = T.NAMES[prefs.lang] || T.NAMES.zh;
    $('edPalette').innerHTML = T.PALETTE.map((c, i) => `<button type="button" class="swatch big" data-brush="${i}" aria-pressed="${i === ed.brush}" aria-label="${names[i]}" title="${names[i]}" style="background:${c}"></button>`).join('');
    $('edPen').setAttribute('aria-pressed', String(ed.tool === 'pen'));
    $('edFill').setAttribute('aria-pressed', String(ed.tool === 'fill'));
    $('edUndo').disabled = !ed.undo.length;
    $('edMoods').innerHTML = MOOD_KEYS.map(k => `<button type="button" class="mood" data-mood="${k}" aria-pressed="${k === ed.color}" style="--mc:${MOODS[k].c}"><i></i>${t('m_' + k)}</button>`).join('');
    const second = edSecond();
    $('edPatterns').innerHTML = T.PATTERN_KEYS.map(k => `<button type="button" class="pat" data-pat="${k}" title="${t('pt_' + k)}" aria-label="${t('pt_' + k)}" style="background-image:url(${artURL(T.pattern(k, ed.brush, second))})"></button>`).join('');
  }
  function paintPix(){
    const ed = state.ed;
    const cells = $('edPix').children;
    for (let i = 0; i < 256; i++) cells[i].style.background = T.PALETTE[ed.art[i]];
  }
  function edPush(){
    const ed = state.ed;
    ed.undo.push(ed.art.slice());
    if (ed.undo.length > 40) ed.undo.shift();
    $('edUndo').disabled = false;
  }
  function edSet(art){ state.ed.art = art; renderEditor(); }

  /* ---------- 事件 ---------- */
  function bind(){
    $('birth').addEventListener('change', e => {
      const d = parseISO(e.target.value);
      if (d && dn(d) <= dn(today())) data.birth = e.target.value;
      else if (!e.target.value) data.birth = null;
      save(); state.sel = null; renderAll();
    });
    $('life').addEventListener('change', e => {
      data.life = clampInt(e.target.value, 40, 120, data.life);
      e.target.value = data.life; save(); renderAll();
    });
    $('themeBtn').addEventListener('click', () => {
      prefs.theme = {system:'light', light:'dark', dark:'system'}[prefs.theme]; savePrefs(); applyTheme();
    });
    $('langBtn').addEventListener('click', () => {
      prefs.lang = prefs.lang === 'zh' ? 'en' : 'zh'; savePrefs();
      state.importData = null; $('importBox').hidden = true; $('dataMsg').textContent = '';
      native.sync();
      renderAll();
    });

    document.querySelectorAll('.seg button').forEach(btn => btn.addEventListener('click', () => {
      prefs.view = btn.dataset.view; state.sel = null; savePrefs(); renderBoard();
    }));
    $('stageToggle').addEventListener('change', e => { data.stagesOn = e.target.checked; save(); renderBoard(); renderStages(); });
    $('stagesOn').addEventListener('change', e => { data.stagesOn = e.target.checked; save(); renderBoard(); });
    $('wallAll').addEventListener('change', e => { prefs.wallAll = e.target.checked; savePrefs(); renderBoard(); });

    $('grid').addEventListener('click', e => {
      const c = e.target.closest(CELL); if (!c) return;
      selectCell(c);
      if (c.dataset.k) openEditor(c.dataset.k);
    });
    $('grid').addEventListener('keydown', e => {
      const keys = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
      const k = keys[e.key];
      if (k){
        e.preventDefault();
        // 「今年」視圖是直的一欄一週，左右跳一週、上下跳一天
        const step = prefs.view === 'days' ? k[0] * 7 + k[1] : k[0] + k[1] * rowStep();
        return moveSel(step);
      }
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        const btn = $('info').querySelector('[data-act="tile"]');
        if (btn) openEditor(btn.dataset.arg);
      }
    });
    $('grid').addEventListener('mouseover', e => {
      if (state.sel != null) return;
      const c = e.target.closest('[data-u],[data-d],[data-k]'); if (!c) return;
      if (c.dataset.k) renderWallInfo(c.dataset.k);
      else if (c.dataset.d != null) renderDayInfo(Number(c.dataset.d));
      else renderLifeInfo(Number(c.dataset.u));
    });
    $('grid').addEventListener('mouseleave', () => { if (state.sel == null) renderBoardInfoDefault(); });
    $('info').addEventListener('click', e => {
      const nb = e.target.closest('[data-nav]');
      if (nb){
        moveSel(Number(nb.dataset.nav));
        const again = $('info').querySelector(`[data-nav="${nb.dataset.nav}"]`); if (again) again.focus();
        return;
      }
      const btn = e.target.closest('[data-act]'); if (!btn) return;
      if (btn.dataset.act === 'tile') openEditor(btn.dataset.arg);
      if (btn.dataset.act === 'ms'){ $('msDate').value = btn.dataset.arg; $('msText').focus(); $('msText').scrollIntoView({block:'center', behavior:'smooth'}); }
    });

    let savedTimer;
    $('intent').addEventListener('input', e => {
      const k = weekKey(today()), v = e.target.value.trim();
      if (v) data.intents[k] = v; else delete data.intents[k];
      save();
      $('intentSaved').textContent = t('saved');
      clearTimeout(savedTimer); savedTimer = setTimeout(() => { $('intentSaved').textContent = ''; }, 1500);
    });
    $('twBtn').addEventListener('click', () => openEditor(weekKey(today())));
    $('twTile').addEventListener('click', () => openEditor(weekKey(today())));

    // 面板表單
    $('peopleForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('psName').value.trim(), year = clampInt($('psYear').value, 1900, today().getFullYear(), null);
      if (!name || year == null) return;
      data.people.push({id: uid(), name, year, per: clampInt($('psFreq').value, 1, 365, 12)});
      save(); $('psName').value = ''; $('psYear').value = ''; renderPeople();
    });
    $('stageForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('sName').value.trim(), from = clampInt($('sFrom').value, 0, 130, null), to = clampInt($('sTo').value, 0, 130, null);
      if (!name || from == null || to == null || to <= from) return;
      const c = (document.querySelector('input[name="sColor"]:checked') || {}).value || STAGE_COLORS[0];
      data.stages.push({id: uid(), name, from, to, color: c});
      save(); $('sName').value = ''; $('sFrom').value = ''; $('sTo').value = ''; renderStages(); renderBoard();
    });
    $('stagePreset').addEventListener('click', () => { data.stages = defaultStages(); save(); renderStages(); renderBoard(); });
    $('stageList').addEventListener('click', e => {
      const sw = e.target.closest('[data-cycle]'); if (!sw) return;
      const s = data.stages.find(x => x.id === sw.dataset.cycle); if (!s) return;
      s.color = STAGE_COLORS[(STAGE_COLORS.indexOf(s.color) + 1) % STAGE_COLORS.length];
      save(); renderStages(); renderBoard();
    });
    $('bucketForm').addEventListener('submit', e => {
      e.preventDefault();
      const text = $('bText').value.trim(), age = clampInt($('bAge').value, 1, 130, null);
      if (!text || age == null) return;
      data.bucket.push({id: uid(), text, age, done: false, doneAt: null});
      save(); $('bText').value = ''; $('bAge').value = ''; renderBucket(); renderBoard();
    });
    $('bucketList').addEventListener('change', e => {
      const cb = e.target.closest('[data-done]'); if (!cb) return;
      const x = data.bucket.find(y => y.id === cb.dataset.done); if (!x) return;
      x.done = cb.checked; x.doneAt = cb.checked ? iso(today()) : null;
      save(); renderBucket(); renderBoard();
    });
    $('cdForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('cdName').value.trim(), d = $('cdDate').value;
      if (!name || !parseISO(d)) return;
      data.countdowns.push({id: uid(), name, d});
      save(); $('cdName').value = ''; $('cdDate').value = ''; renderCountdowns(); renderBoard();
    });
    $('msForm').addEventListener('submit', e => {
      e.preventDefault();
      const d = $('msDate').value, txt = $('msText').value.trim();
      if (!parseISO(d) || !txt) return;
      data.milestones.push({id: uid(), d, t: txt});
      save(); $('msText').value = ''; renderMs(); renderBoard();
    });
    document.querySelector('.panels').addEventListener('click', e => {
      const btn = e.target.closest('[data-del]'); if (!btn) return;
      const kind = btn.dataset.del;
      const idx = data[kind].findIndex(x => x.id === btn.dataset.id); if (idx < 0) return;
      const [item] = data[kind].splice(idx, 1);
      save(); renderPanels(); renderBoard();
      toast(t('deleted', {name: item.name || item.text || item.t || ''}), () => {
        data[kind].splice(Math.min(idx, data[kind].length), 0, item);
        save(); renderPanels(); renderBoard();
      });
    });
    $('toastUndo').addEventListener('click', () => { const u = toastUndo; $('toast').hidden = true; toastUndo = null; if (u) u(); });

    // 備份
    $('exportBtn').addEventListener('click', async () => {
      const json = backupJSON();
      if (isNative){
        const fs = plugin('Filesystem'), sh = plugin('Share');
        try{
          const r = await fs.writeFile({path: `life-calendar-${iso(today())}.json`, data: json, directory: 'CACHE', encoding: 'utf8'});
          await sh.share({title: t('appName'), files: [r.uri]});
          prefs.lastBackup = iso(today()); savePrefs(); renderData();
        }catch(err){ if (!/cancel/i.test(String(err && err.message))) showExportText(json); }
        return;
      }
      try{
        const blob = new Blob([json], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `life-calendar-${iso(today())}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }catch(err){ showExportText(json); }
      prefs.lastBackup = iso(today()); savePrefs(); renderData();
    });
    $('copyBtn').addEventListener('click', () => {
      const json = backupJSON();
      const done = () => { $('dataMsg').textContent = t('copied'); prefs.lastBackup = iso(today()); savePrefs(); renderData(); };
      try{
        navigator.clipboard.writeText(json).then(done, () => showExportText(json));
      }catch(err){ showExportText(json); }
    });
    $('importFile').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => checkImport(String(rd.result));
      rd.readAsText(f);
      e.target.value = '';
    });
    $('importCheck').addEventListener('click', () => checkImport($('importText').value));
    $('importConfirm').addEventListener('click', () => {
      if (!state.importData) return;
      data = state.importData; if (!data.stages) data.stages = defaultStages();
      state.importData = null; save();
      $('importBox').hidden = true; $('importText').value = '';
      $('dataMsg').textContent = t('importDone');
      $('birth').value = data.birth || ''; $('life').value = data.life;
      renderAll();
    });
    $('importCancel').addEventListener('click', () => { state.importData = null; $('importBox').hidden = true; });

    // 主畫面安裝
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; renderPhone(); });
    window.addEventListener('appinstalled', () => { deferredPrompt = null; renderPhone(); });
    $('installBtn').addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(() => { deferredPrompt = null; renderPhone(); });
    });

    // 編輯器
    $('edClose').addEventListener('click', closeEditor);
    $('edCancel').addEventListener('click', closeEditor);
    $('editor').addEventListener('click', e => { if (e.target === $('editor')) closeEditor(); });
    document.addEventListener('keydown', e => {
      if (!state.ed) return;
      if (e.key === 'Escape') closeEditor();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && document.activeElement !== $('edText')){ e.preventDefault(); $('edUndo').click(); }
    });
    $('edText').addEventListener('input', e => { state.ed.text = e.target.value; });
    $('edMoods').addEventListener('click', e => {
      const b = e.target.closest('[data-mood]'); if (!b) return;
      state.ed.color = b.dataset.mood; state.ed.moodTouched = true; renderEditor();
    });
    $('edPalette').addEventListener('click', e => {
      const b = e.target.closest('[data-brush]'); if (!b) return;
      state.ed.brush = Number(b.dataset.brush); renderEditor();
    });
    $('edPen').addEventListener('click', () => { state.ed.tool = 'pen'; renderEditor(); });
    $('edFill').addEventListener('click', () => { state.ed.tool = 'fill'; renderEditor(); });
    $('edUndo').addEventListener('click', () => {
      const ed = state.ed; if (!ed.undo.length) return;
      edSet(ed.undo.pop());
    });
    $('edPatterns').addEventListener('click', e => {
      const b = e.target.closest('[data-pat]'); if (!b) return;
      edPush(); edSet(T.pattern(b.dataset.pat, state.ed.brush, edSecond()));
    });
    $('edMotifs').addEventListener('click', e => {
      const b = e.target.closest('[data-motif]'); if (!b) return;
      edPush(); edSet(T.stamp(state.ed.art, b.dataset.motif));
    });
    $('edAuto').addEventListener('click', () => {
      const ed = state.ed;
      edPush();
      const src = ed.text.trim() || data.intents[ed.k] || '';
      edSet(T.generate(src || ed.k, ed.autoN++));
      const found = src ? T.describe(src, prefs.lang) : [];
      $('edAutoMsg').textContent = found.length ? t('edFound', {names: found.join(prefs.lang === 'zh' ? '、' : ', ')}) : t('edNotFound');
    });
    $('edClear').addEventListener('click', () => { edPush(); edSet(T.blank(0)); });
    let drawing = false;
    const pixAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.parentElement === $('edPix') ? el : null; };
    const paintAt = el => {
      const ed = state.ed, i = +el.dataset.i;
      if (ed.art[i] !== ed.brush){ ed.art[i] = ed.brush; el.style.background = T.PALETTE[ed.brush]; }
    };
    $('edPix').addEventListener('pointerdown', e => {
      const el = pixAt(e.clientX, e.clientY); if (!el) return;
      e.preventDefault();
      edPush();
      if (state.ed.tool === 'fill'){ edSet(T.fill(state.ed.art, +el.dataset.i, state.ed.brush)); return; }
      drawing = true; paintAt(el);
      try{ $('edPix').setPointerCapture(e.pointerId); }catch(err){}
    });
    $('edPix').addEventListener('pointermove', e => {
      if (!drawing) return;
      const el = pixAt(e.clientX, e.clientY); if (el) paintAt(el);
    });
    const stopDraw = () => { if (drawing){ drawing = false; renderEditor(); } };
    $('edPix').addEventListener('pointerup', stopDraw);
    $('edPix').addEventListener('pointercancel', stopDraw);
    $('edSave').addEventListener('click', () => {
      const ed = state.ed;
      data.reviews[ed.k] = { text: $('edText').value.trim().slice(0, 200), color: ed.moodTouched ? ed.color : moodFor(ed.art), art: T.toStr(ed.art) };
      save(); closeEditor(); renderBoard(); renderWeekCard();
    });
    $('edDelete').addEventListener('click', () => {
      const k = state.ed.k, old = data.reviews[k];
      delete data.reviews[k];
      save(); closeEditor(); renderBoard(); renderWeekCard();
      toast(t('tileDeleted'), () => { data.reviews[k] = old; save(); renderBoard(); renderWeekCard(); });
    });

    // 縮放
    const zoomBy = d => {
      const cur = ZOOMS.indexOf(ZOOMS.includes(prefs.zoom) ? prefs.zoom : 1);
      prefs.zoom = ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, cur + d))];
      savePrefs(); renderBoard();
      const target = $('grid').querySelector('.sel') || $('grid').querySelector('.c.n');
      if (target) target.scrollIntoView({block: 'center', inline: 'center'});
    };
    $('zoomIn').addEventListener('click', () => zoomBy(1));
    $('zoomOut').addEventListener('click', () => zoomBy(-1));

    // 每週提醒與小工具
    $('rDay').addEventListener('change', e => { prefs.remind.day = clampInt(e.target.value, 0, 6, 0); savePrefs(); renderPhone(); if (prefs.remind.on) scheduleNative(); });
    $('rTime').addEventListener('change', e => {
      if (!/^\d{2}:\d{2}$/.test(e.target.value)) return;
      prefs.remind.time = e.target.value; savePrefs(); renderPhone(); if (prefs.remind.on) scheduleNative();
    });
    $('icsBtn').addEventListener('click', () => {
      const blob = new Blob([icsText()], {type: 'text/calendar'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'life-calendar-weekly.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    $('remindToggle').addEventListener('click', async () => {
      prefs.remind.on = !prefs.remind.on; savePrefs();
      const ok = await scheduleNative();
      if (!ok && prefs.remind.on){ prefs.remind.on = false; savePrefs(); renderPhone(); $('remindMsg').textContent = t('remindDenied'); return; }
      renderPhone();
    });
    $('widgetAddBtn').addEventListener('click', async () => {
      const w = plugin('LifeWidget'); if (!w) return;
      try{ const r = await w.requestPin(); $('widgetMsg').textContent = r && r.supported ? t('widgetHelp') : t('widgetUnsupported'); }
      catch(e){ $('widgetMsg').textContent = t('widgetUnsupported'); }
    });
  }

  const CELL = '[data-u],[data-d],[data-k]';
  function selectCell(c){
    const prev = $('grid').querySelector('.sel'); if (prev) prev.classList.remove('sel');
    c.classList.add('sel');
    if (c.dataset.k){ state.sel = c.dataset.k; renderWallInfo(c.dataset.k); }
    else if (c.dataset.d != null){ state.sel = Number(c.dataset.d); renderDayInfo(state.sel); }
    else { state.sel = Number(c.dataset.u); renderLifeInfo(state.sel); }
    c.scrollIntoView({block: 'nearest', inline: 'nearest'});
  }
  const rowStep = () => ({week: 52, month: 60, year: 10, days: 7, wall: window.matchMedia('(max-width:560px)').matches ? 14 : 27})[prefs.view];
  function moveSel(step){
    const cells = [...$('grid').querySelectorAll(CELL)];
    if (!cells.length) return;
    let i = cells.findIndex(c => c.classList.contains('sel'));
    if (i < 0) i = cells.findIndex(c => c.classList.contains('n') || c.classList.contains('now'));
    if (i < 0) i = 0;
    selectCell(cells[Math.max(0, Math.min(cells.length - 1, i + step))]);
  }

  function renderBoardInfoDefault(){
    if (prefs.view === 'days'){ const td = today(); renderDayInfo(dn(td) - dn(new Date(td.getFullYear(), 0, 1))); }
    else if (prefs.view === 'wall') renderWallInfo(weekKey(today()));
    else renderLifeInfo(VIEWS[prefs.view].unitOf(birth(), today()));
  }

  function backupJSON(){ return JSON.stringify({app: 'life-calendar', version: 2, exportedAt: new Date().toISOString(), data}, null, 2); }
  function showExportText(json){
    const ta = $('exportText'); ta.hidden = false; ta.value = json; ta.focus(); ta.select();
    $('dataMsg').textContent = t('copyFail');
  }
  function checkImport(text){
    let parsed = null;
    try{ parsed = JSON.parse(text); }catch(e){}
    const raw = parsed && parsed.app === 'life-calendar' ? parsed.data : parsed && ('birth' in parsed || 'reviews' in parsed) ? parsed : null;
    if (!raw){ state.importData = null; $('importBox').hidden = true; $('dataMsg').textContent = t('importBad'); return; }
    const nd = normalize(raw);
    state.importData = nd;
    $('importSummary').textContent = t('importSummary', {r: Object.keys(nd.reviews).length, m: nd.milestones.length, p: nd.people.length, b: nd.bucket.length, c: nd.countdowns.length});
    $('importBox').hidden = false;
    $('dataMsg').textContent = '';
  }

  /* ---------- 啟動 ---------- */
  // 在 Claude 頁面裡沒辦法下載檔案，只保留「複製備份文字」
  if (!window.LC_STANDALONE && !isNative) $('exportBtn').hidden = true;
  if (isNative) document.documentElement.classList.add('native');
  store.set('lc.data', data);
  $('birth').value = data.birth || '';
  $('birth').max = iso(today());
  $('life').value = data.life;
  bind();
  renderAll();
  setInterval(tick, 1000);
  if (isNative){
    native.restore().then(restored => {
      if (restored){ $('birth').value = data.birth || ''; $('life').value = data.life; renderAll(); }
      native.sync();
      if (prefs.remind.on) scheduleNative();
    });
    // 從背景回到 App 時，日期可能已經換了
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }
  if (window.LC_STANDALONE && !isNative && 'serviceWorker' in navigator){
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
