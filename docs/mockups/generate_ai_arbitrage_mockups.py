# -*- coding: utf-8 -*-
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
FONT = r"C:\Windows\Fonts\msyh.ttc"
FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
if not Path(FONT_BOLD).exists():
    FONT_BOLD = FONT


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size)


F = {
    "tiny": font(13),
    "xs": font(15),
    "sm": font(18),
    "nav": font(17),
    "h": font(20, True),
    "md": font(22),
    "title": font(24, True),
    "lg": font(28, True),
    "num": font(34, True),
    "xl": font(38, True),
}

C = {
    "bg": "#07111F",
    "panel": "#101C2A",
    "panel2": "#0B1624",
    "border": "#1D2B3A",
    "grid": "#203247",
    "text": "#EAF2FF",
    "muted": "#91A4B8",
    "blue": "#2563EB",
    "green": "#22C55E",
    "red": "#EF4444",
    "yellow": "#F59E0B",
    "purple": "#8B5CF6",
    "cyan": "#14B8A6",
    "white": "#FFFFFF",
}


def rect(d, xy, fill, outline=None, radius=8, width=1):
    d.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline or fill, width=width)


def text(d, xy, s, fill=None, f=None, anchor=None):
    d.text(xy, s, fill=fill or C["text"], font=f or F["sm"], anchor=anchor)


def center_text(d, box, s, fill=None, f=None):
    x1, y1, x2, y2 = box
    d.text(((x1 + x2) / 2, (y1 + y2) / 2), s, fill=fill or C["text"], font=f or F["sm"], anchor="mm")


def line_chart(d, box, color=None, fill_area=True):
    color = color or C["green"]
    x1, y1, x2, y2 = box
    values = [32, 34, 31, 37, 35, 40, 42, 38, 44, 47, 45, 51, 55, 52, 58, 60, 57, 62, 66, 61, 65, 70]
    mn = min(values)
    mx = max(values)
    pts = []
    for i, v in enumerate(values):
        x = x1 + i * (x2 - x1) / (len(values) - 1)
        y = y2 - (v - mn) / (mx - mn) * (y2 - y1)
        pts.append((x, y))
    if fill_area:
        d.polygon(pts + [(x2, y2), (x1, y2)], fill="#0F2B28")
    d.line(pts, fill=color, width=3)


def candles(d, box):
    x1, y1, x2, y2 = box
    for off in [50, 105, 158]:
        d.line((x1, y1 + off, x2, y1 + off), fill=C["grid"], width=1)
    vals = [
        (80, 115),
        (90, 70),
        (75, 96),
        (86, 102),
        (100, 60),
        (65, 50),
        (55, 78),
        (82, 88),
        (86, 68),
        (74, 92),
        (95, 105),
        (108, 82),
        (90, 58),
        (62, 75),
        (72, 42),
        (45, 66),
        (58, 88),
        (92, 78),
    ]
    w = (x2 - x1) / len(vals)
    for i, (a, b) in enumerate(vals):
        cx = x1 + i * w + w / 2
        high = min(a, b) - 18
        low = max(a, b) + 18
        yy1 = y1 + a
        yy2 = y1 + b
        col = C["green"] if b < a else C["red"]
        d.line((cx, y1 + high, cx, y1 + low), fill=col, width=2)
        d.rectangle((cx - 5, min(yy1, yy2), cx + 5, max(yy1, yy2)), fill=col)


def progress(d, x, y, w, label, value, color=None):
    color = color or C["green"]
    text(d, (x, y), label, C["muted"], F["xs"])
    text(d, (x + w, y), str(value), color, F["xs"], anchor="ra")
    rect(d, (x, y + 24, x + w, y + 30), "#17263A", radius=3)
    rect(d, (x, y + 24, x + w * value / 100, y + 30), color, radius=3)


def draw_customer():
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), C["bg"])
    d = ImageDraw.Draw(img)
    for i in range(0, w, 80):
        d.line((i, 0, i, h), fill="#081827")
    for j in range(0, h, 80):
        d.line((0, j, w, j), fill="#081827")

    text(d, (32, 26), "客户前台（日语 / 日元）：响应式 AI 站内模拟套利系统", C["text"], F["xl"])
    text(d, (32, 76), "メール認証で登録。日本語とJPY表示。自動AI裁定のON/OFF、詳細確認、招待報酬まで閉ループで操作可能。", C["muted"], F["md"])

    x, y, bw, bh = 40, 125, 1260, 890
    rect(d, (x, y, x + bw, y + bh), "#050B14", C["border"], 12, 2)
    rect(d, (x, y, x + bw, y + 46), "#0A1422", C["border"], 12)
    for i, col in enumerate([C["red"], C["yellow"], C["green"]]):
        d.ellipse((x + 18 + i * 24, y + 16, x + 30 + i * 24, y + 28), fill=col)
    text(d, (x + 112, y + 14), "app.ai-arbitrage.demo/dashboard", C["muted"], F["xs"])

    bx, by = x, y + 46
    sw = 218
    rect(d, (bx, by, bx + sw, y + bh), "#06101C", "#0F2032", 0)
    d.ellipse((bx + 20, by + 24, bx + 52, by + 56), fill=C["blue"])
    text(d, (bx + 66, by + 26), "AI Arbitrage Pro", C["text"], F["h"])
    nav = ["ホーム", "裁定機会", "自動AI裁定", "資産ウォレット", "入金 / 出金", "本人確認", "VIP特典", "取引履歴", "招待"]
    ny = by + 90
    for idx, label in enumerate(nav):
        if idx == 0:
            rect(d, (bx + 16, ny, bx + sw - 16, ny + 42), C["blue"], radius=6)
            text(d, (bx + 42, ny + 10), label, C["white"], F["nav"])
        else:
            text(d, (bx + 42, ny + 10), label, C["muted"], F["nav"])
        ny += 52

    rect(d, (bx + 16, y + bh - 152, bx + sw - 16, y + bh - 64), C["panel"], C["border"], 8)
    text(d, (bx + 30, y + bh - 136), "VIP1 · AI算力 2x", C["muted"], F["xs"])
    text(d, (bx + 30, y + bh - 108), "残高 ¥1,887,000", C["text"], F["h"])
    text(d, (bx + 30, y + bh - 80), "本日の機会 6 / 10", C["green"], F["xs"])

    cx, cy = bx + sw + 22, by + 18
    cw = bw - sw - 44
    text(d, (cx, cy), "ホーム", C["text"], F["title"])
    text(d, (cx + 675, cy + 4), "東京時間 2026-06-27 16:30:45", C["muted"], F["xs"])
    rect(d, (cx + 905, cy - 4, cx + cw - 8, cy + 36), "#0F2032", C["border"], 20)
    text(d, (cx + 922, cy + 6), "● 自動AI裁定：稼働中", C["green"], F["xs"])

    metrics = [
        ("裁定機会", "6 / 10", "VIP1 本日枠", C["blue"]),
        ("AI算力", "2x", "スキャン間隔 10秒", C["purple"]),
        ("残高", "¥1,887,000", "利用可能 ¥1,797,000", C["green"]),
        ("本日の利益", "+¥19,275", "完了 6回", C["green"]),
    ]
    my = cy + 58
    cardw = (cw - 36) / 4
    for i, (a, b, c, col) in enumerate(metrics):
        xx = cx + i * (cardw + 12)
        rect(d, (xx, my, xx + cardw, my + 118), C["panel"], C["border"], 7)
        text(d, (xx + 18, my + 18), a, C["muted"], F["xs"])
        text(d, (xx + 18, my + 48), b, C["text"], F["num"])
        text(d, (xx + 18, my + 88), c, col, F["xs"])
        line_chart(d, (xx + cardw - 98, my + 44, xx + cardw - 18, my + 92), col, False)

    tx, ty, tw, th = cx, my + 138, 710, 355
    rect(d, (tx, ty, tx + tw, ty + th), C["panel"], C["border"], 8)
    text(d, (tx + 18, ty + 18), "AIが検出したサイト内裁定機会", C["text"], F["h"])
    rect(d, (tx + 440, ty + 12, tx + 560, ty + 42), C["panel2"], C["border"], 5)
    center_text(d, (tx + 440, ty + 12, tx + 560, ty + 42), "VIP1 専用", C["muted"], F["xs"])
    rect(d, (tx + 574, ty + 12, tx + 690, ty + 42), C["blue"], radius=5)
    center_text(d, (tx + 574, ty + 12, tx + 690, ty + 42), "自動実行中", C["white"], F["xs"])
    headers = ["銘柄", "経路", "元本", "予想利益", "AI信頼", "状態"]
    cols = [tx + 20, tx + 110, tx + 310, tx + 405, tx + 515, tx + 610]
    hy = ty + 62
    for i, hdr in enumerate(headers):
        text(d, (cols[i], hy), hdr, C["muted"], F["tiny"])
    rows = [
        ("BTC/JPY", "bitFlyer -> Coincheck", "¥75,000", "+¥16,800", "96%", "精算中"),
        ("ETH/JPY", "GMO Coin -> bitbank", "¥75,000", "+¥15,600", "94%", "AI実行"),
        ("SOL/JPY", "SBI VC -> BITPoint", "¥75,000", "+¥18,200", "92%", "待機中"),
        ("XRP/JPY", "Zaif -> BitTrade", "¥75,000", "+¥12,900", "90%", "完了"),
        ("DOGE/JPY", "OKCoinJP -> Binance JP", "¥75,000", "+¥7,400", "88%", "完了"),
    ]
    ry = ty + 96
    for r in rows:
        d.line((tx + 16, ry - 14, tx + tw - 16, ry - 14), fill=C["border"])
        for i, val in enumerate(r):
            col = C["green"] if i in [3, 4] else C["text"]
            if i == 5:
                col = C["yellow"] if val in ["精算中", "AI実行"] else (C["blue"] if val == "待機中" else C["green"])
            text(d, (cols[i], ry), val, col, F["xs"])
        ry += 50

    wx, wy = tx, ty + th + 18
    rect(d, (wx, wy, wx + tw, wy + 116), C["panel"], C["border"], 8)
    text(d, (wx + 18, wy + 16), "AI自動裁定フロー", C["text"], F["h"])
    steps = ["機会検出", "AI分析", "元本凍結", "模擬実行", "東京時間精算", "利益反映"]
    sx = wx + 26
    for i, st in enumerate(steps):
        cx0 = sx + i * 112
        d.ellipse((cx0, wy + 58, cx0 + 34, wy + 92), fill=C["green"] if i < 5 else C["blue"])
        center_text(d, (cx0, wy + 58, cx0 + 34, wy + 92), str(i + 1), C["white"], F["tiny"])
        text(d, (cx0 - 8, wy + 96), st, C["muted"], F["tiny"])
        if i < len(steps) - 1:
            d.line((cx0 + 38, wy + 75, cx0 + 104, wy + 75), fill=C["grid"], width=2)

    rx = tx + tw + 18
    rw = cw - tw - 18
    rect(d, (rx, ty, rx + rw, ty + 210), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 18), "価格チャート BTC/JPY", C["text"], F["h"])
    candles(d, (rx + 18, ty + 56, rx + rw - 18, ty + 184))
    text(d, (rx + rw - 112, ty + 58), "68,245.50", C["green"], F["xs"])
    rect(d, (rx, ty + 228, rx + rw, ty + 405), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 246), "注文板 / 模擬深度", C["text"], F["h"])
    ob_y = ty + 286
    for i in range(5):
        text(d, (rx + 22, ob_y + i * 24), f"{68252 - i * 3}.20", C["red"], F["tiny"])
        text(d, (rx + 140, ob_y + i * 24), f"{0.42 + i * 0.19:.2f}", C["red"], F["tiny"])
        text(d, (rx + 230, ob_y + i * 24), f"{68239 - i * 3}.80", C["green"], F["tiny"])
        text(d, (rx + 348, ob_y + i * 24), f"{0.55 + i * 0.22:.2f}", C["green"], F["tiny"])
    rect(d, (rx, ty + 423, rx + rw, ty + 720), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 442), "AI分析サマリー", C["text"], F["h"])
    d.ellipse((rx + 28, ty + 486, rx + 146, ty + 604), outline=C["green"], width=10)
    center_text(d, (rx + 28, ty + 486, rx + 146, ty + 604), "92\n評価", C["text"], F["md"])
    progress(d, rx + 180, ty + 488, rw - 210, "流動性", 90, C["green"])
    progress(d, rx + 180, ty + 532, rw - 210, "価格安定", 85, C["cyan"])
    progress(d, rx + 180, ty + 576, rw - 210, "リスク", 22, C["red"])
    rect(d, (rx + 18, ty + 625, rx + rw - 18, ty + 678), "#142235", radius=6)
    text(d, (rx + 34, ty + 640), "利益範囲 ¥5,000 - ¥20,000。80%の確率で ¥15,000 以上。次回スキャン 00:08。", C["muted"], F["xs"])
    rect(d, (cx, y + bh - 44, cx + cw, y + bh - 8), C["panel2"], C["border"], 5)
    text(d, (cx + 18, y + bh - 34), "BTC/JPY ¥10,245,678 +0.8%   ETH/JPY ¥593,245 +1.2%   SOL/JPY ¥24,567 +2.1%   市場：模擬稼働中", C["muted"], F["xs"])

    px, py, pw, ph = 1340, 125, 500, 890
    rect(d, (px, py, px + pw, py + ph), "#02060C", C["border"], 34, 3)
    rect(d, (px + 20, py + 18, px + pw - 20, py + ph - 18), C["bg"], radius=26)
    text(d, (px + 46, py + 50), "AI Arbitrage Pro", C["text"], F["h"])
    rect(d, (px + 330, py + 46, px + 454, py + 78), "#10243A", radius=16)
    center_text(d, (px + 330, py + 46, px + 454, py + 78), "VIP1 · 稼働中", C["green"], F["tiny"])
    rect(d, (px + 38, py + 102, px + pw - 38, py + 204), C["panel"], C["border"], 8)
    text(d, (px + 58, py + 122), "自動AI裁定", C["muted"], F["xs"])
    text(d, (px + 58, py + 150), "稼働中", C["green"], F["xl"])
    text(d, (px + 250, py + 124), "本日の機会", C["muted"], F["xs"])
    text(d, (px + 250, py + 152), "6 / 10", C["text"], F["lg"])
    rect(d, (px + 38, py + 224, px + 238, py + 318), C["panel"], C["border"], 8)
    text(d, (px + 58, py + 242), "AI算力", C["muted"], F["xs"])
    text(d, (px + 58, py + 270), "2x", C["text"], F["num"])
    rect(d, (px + 254, py + 224, px + pw - 38, py + 318), C["panel"], C["border"], 8)
    text(d, (px + 274, py + 242), "本日の利益", C["muted"], F["xs"])
    text(d, (px + 274, py + 270), "+¥19,275", C["green"], F["lg"])
    text(d, (px + 42, py + 346), "おすすめ裁定機会", C["text"], F["h"])
    cards = [
        ("BTC/JPY", "bitFlyer -> Coincheck", "元本 ¥75,000", "予想 +¥16,800", "AI 96%", "精算中"),
        ("ETH/JPY", "GMO Coin -> bitbank", "元本 ¥75,000", "予想 +¥15,600", "AI 94%", "実行中"),
        ("SOL/JPY", "SBI VC -> BITPoint", "元本 ¥75,000", "予想 +¥18,200", "AI 92%", "待機中"),
    ]
    yy = py + 382
    for card in cards:
        rect(d, (px + 38, yy, px + pw - 38, yy + 112), C["panel"], C["border"], 8)
        text(d, (px + 58, yy + 16), card[0], C["text"], F["h"])
        text(d, (px + 58, yy + 46), card[1], C["muted"], F["xs"])
        text(d, (px + 58, yy + 76), card[2], C["muted"], F["xs"])
        text(d, (px + 210, yy + 76), card[3], C["green"], F["xs"])
        rect(d, (px + 340, yy + 18, px + 442, yy + 46), C["panel2"], C["border"], 14)
        center_text(d, (px + 340, yy + 18, px + 442, yy + 46), card[4], C["green"], F["tiny"])
        text(d, (px + 360, yy + 76), card[5], C["yellow"] if card[5] != "待执行" else C["blue"], F["xs"])
        yy += 128
    rect(d, (px + 38, py + 772, px + pw - 38, py + 836), C["panel"], C["border"], 8)
    text(d, (px + 58, py + 790), "最近の精算：XRP/JPY 元本 ¥75,000 利益 +¥12,900", C["muted"], F["xs"])
    rect(d, (px + 20, py + ph - 92, px + pw - 20, py + ph - 18), "#091525", radius=22)
    for i, tab in enumerate(["ホーム", "機会", "市場", "履歴", "招待"]):
        center_text(d, (px + 30 + i * 92, py + ph - 78, px + 110 + i * 92, py + ph - 32), tab, C["blue"] if i == 0 else C["muted"], F["xs"])

    path = OUT / "customer-frontend-responsive-mockup.png"
    img.save(path)
    return path


def draw_admin():
    w, h = 1920, 1080
    img = Image.new("RGB", (w, h), C["bg"])
    d = ImageDraw.Draw(img)
    for i in range(0, w, 96):
        d.line((i, 0, i, h), fill="#081827")
    for j in range(0, h, 96):
        d.line((0, j, w, j), fill="#081827")
    text(d, (32, 26), "管理后台（中文）：客户、资金、KYC、VIP、交易所、邀请返佣管理", C["text"], F["xl"])
    text(d, (32, 76), "后台配置日语前台、日元金额、东京时间、VIP利润概率、交易所API秒数和邀请下线利润", C["muted"], F["md"])

    x, y, bw, bh = 40, 125, 1840, 890
    rect(d, (x, y, x + bw, y + bh), "#050B14", C["border"], 12, 2)
    rect(d, (x, y, x + bw, y + 46), "#0A1422", C["border"], 12)
    for i, col in enumerate([C["red"], C["yellow"], C["green"]]):
        d.ellipse((x + 18 + i * 24, y + 16, x + 30 + i * 24, y + 28), fill=col)
    text(d, (x + 112, y + 14), "admin.ai-arbitrage.demo", C["muted"], F["xs"])

    bx, by, sw = x, y + 46, 246
    rect(d, (bx, by, bx + sw, y + bh), "#06101C", "#0F2032", 0)
    d.rectangle((bx + 22, by + 24, bx + 54, by + 56), fill=C["purple"])
    text(d, (bx + 70, by + 25), "Admin Console", C["text"], F["h"])
    nav = ["运营总览", "客户管理", "身份认证审核", "入金管理", "出金管理", "VIP 与 AI 算力", "交易所API设置", "套利机会配置", "邀请返佣", "资金流水", "审计日志"]
    ny = by + 90
    for idx, label in enumerate(nav):
        if idx == 0:
            rect(d, (bx + 16, ny, bx + sw - 16, ny + 40), C["blue"], radius=6)
            text(d, (bx + 42, ny + 9), label, C["white"], F["nav"])
        else:
            text(d, (bx + 42, ny + 9), label, C["muted"], F["nav"])
        ny += 48
    rect(d, (bx + 18, y + bh - 150, bx + sw - 18, y + bh - 64), C["panel"], C["border"], 8)
    text(d, (bx + 34, y + bh - 132), "当前角色", C["muted"], F["xs"])
    text(d, (bx + 34, y + bh - 104), "超级管理员", C["text"], F["h"])
    text(d, (bx + 34, y + bh - 78), "所有操作写入审计日志", C["yellow"], F["tiny"])

    cx, cy = bx + sw + 24, by + 20
    cw = bw - sw - 48
    text(d, (cx, cy), "运营总览", C["text"], F["title"])
    text(d, (cx + 1120, cy + 4), "东京时间 2026-06-27 16:30:45 · 后台在线", C["muted"], F["xs"])
    kpis = [
        ("今日入金", "¥19,267,500", "待确认 18", C["green"]),
        ("今日出金", "¥6,345,000", "待审核 9", C["yellow"]),
        ("KYC 待审", "37", "平均 12 分钟", C["blue"]),
        ("模拟套利", "1,284 次", "收益 +¥2,838,000", C["purple"]),
        ("异常账户", "6", "需风控复核", C["red"]),
    ]
    ky = cy + 58
    kw = (cw - 48) / 5
    for i, (a, b, c, col) in enumerate(kpis):
        xx = cx + i * (kw + 12)
        rect(d, (xx, ky, xx + kw, ky + 116), C["panel"], C["border"], 8)
        text(d, (xx + 16, ky + 16), a, C["muted"], F["xs"])
        text(d, (xx + 16, ky + 46), b, C["text"], F["lg"])
        text(d, (xx + 16, ky + 82), c, col, F["xs"])

    tx, ty, tw, th = cx, ky + 138, 930, 356
    rect(d, (tx, ty, tx + tw, ty + th), C["panel"], C["border"], 8)
    text(d, (tx + 18, ty + 18), "客户管理与实时状态", C["text"], F["h"])
    rect(d, (tx + 690, ty + 12, tx + 810, ty + 42), C["panel2"], C["border"], 5)
    center_text(d, (tx + 690, ty + 12, tx + 810, ty + 42), "筛选 VIP1", C["muted"], F["xs"])
    rect(d, (tx + 824, ty + 12, tx + 910, ty + 42), C["blue"], radius=5)
    center_text(d, (tx + 824, ty + 12, tx + 910, ty + 42), "编辑客户", C["white"], F["xs"])
    headers = ["用户", "VIP", "AI算力", "可用余额", "KYC", "状态", "累计收益"]
    cols = [tx + 20, tx + 190, tx + 280, tx + 390, tx + 545, tx + 650, tx + 760]
    hy = ty + 64
    for i, hdr in enumerate(headers):
        text(d, (cols[i], hy), hdr, C["muted"], F["tiny"])
    rows = [
        ("U10081", "VIP1", "2x", "¥1,887,000", "已通过", "正常", "+¥133,500"),
        ("U10082", "VIP2", "5x", "¥6,768,000", "审核中", "正常", "+¥678,000"),
        ("U10083", "VIP1", "2x", "¥582,000", "未认证", "限制出金", "+¥31,500"),
        ("U10084", "VIP3", "10x", "¥18,000,000", "已通过", "正常", "+¥2,805,000"),
        ("U10085", "VIP0", "1x", "¥12,000", "驳回", "冻结", "+¥0"),
    ]
    ry = ty + 98
    for row in rows:
        d.line((tx + 16, ry - 14, tx + tw - 16, ry - 14), fill=C["border"])
        for i, val in enumerate(row):
            col = C["text"]
            if i in [2, 6]:
                col = C["green"]
            if val == "审核中":
                col = C["yellow"]
            if val in ["限制出金", "冻结", "驳回"]:
                col = C["red"]
            text(d, (cols[i], ry), val, col, F["xs"])
        ry += 50

    sx, sy, sh = tx, ty + th + 18, 318
    rect(d, (sx, sy, sx + tw, sy + sh), C["panel"], C["border"], 8)
    text(d, (sx + 18, sy + 18), "套利机会配置：VIP1 自动模拟计划（JPY / 东京时间）", C["text"], F["h"])
    fields = [
        ("适用等级", "VIP1"),
        ("机会次数", "10 次 / 日"),
        ("生成间隔", "10 秒"),
        ("单次本金", "¥75,000"),
        ("利润范围", "¥5,000 - ¥20,000"),
        ("高利润概率", "80% >= ¥15,000"),
        ("AI 信赖度", "95%"),
        ("结算延迟", "8 秒"),
    ]
    fx, fy = sx + 18, sy + 62
    for i, (lab, val) in enumerate(fields):
        col = i % 4
        row = i // 4
        bx0 = fx + col * 220
        by0 = fy + row * 78
        rect(d, (bx0, by0, bx0 + 200, by0 + 58), C["panel2"], C["border"], 6)
        text(d, (bx0 + 12, by0 + 8), lab, C["muted"], F["tiny"])
        text(d, (bx0 + 12, by0 + 30), val, C["text"], F["xs"])
    rect(d, (sx + 18, sy + 226, sx + tw - 18, sy + 292), "#142235", C["border"], 6)
    text(d, (sx + 34, sy + 242), "利润规则：本金 ¥75,000；利润 ¥5,000-¥20,000；80% 概率利润不低于 ¥15,000。", C["green"], F["xs"])
    text(d, (sx + 34, sy + 266), "执行链路：发现机会 → AI分析 → 冻结本金 → 站内模拟执行 → 东京时间结算 → 写入资金流水", C["muted"], F["xs"])

    rx = tx + tw + 18
    rw = cw - tw - 18
    rect(d, (rx, ty, rx + rw, ty + 170), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 18), "入金审核队列", C["text"], F["h"])
    for i, row in enumerate([("D8921", "U10081", "¥750,000", "待确认"), ("D8922", "U10092", "¥180,000", "待确认"), ("D8923", "U10077", "¥3,000,000", "需复核")]):
        yy = ty + 58 + i * 32
        text(d, (rx + 18, yy), row[0], C["muted"], F["tiny"])
        text(d, (rx + 100, yy), row[1], C["text"], F["tiny"])
        text(d, (rx + 210, yy), row[2], C["green"], F["tiny"])
        text(d, (rx + 330, yy), row[3], C["yellow"] if row[3] != "需复核" else C["red"], F["tiny"])

    rect(d, (rx, ty + 188, rx + rw, ty + 358), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 206), "出金审核队列", C["text"], F["h"])
    for i, row in enumerate([("W3312", "U10083", "¥120,000", "限制出金"), ("W3313", "U10084", "¥1,500,000", "待审核"), ("W3314", "U10095", "¥52,500", "待审核")]):
        yy = ty + 246 + i * 32
        text(d, (rx + 18, yy), row[0], C["muted"], F["tiny"])
        text(d, (rx + 100, yy), row[1], C["text"], F["tiny"])
        text(d, (rx + 210, yy), row[2], C["yellow"], F["tiny"])
        text(d, (rx + 330, yy), row[3], C["red"] if row[3] == "限制出金" else C["yellow"], F["tiny"])

    rect(d, (rx, ty + 376, rx + rw, ty + 564), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 394), "交易所API秒数 / 邀请返佣", C["text"], F["h"])
    for i, row in enumerate([("bitFlyer", "行情2秒 / 盘口2秒 / 账户30秒", "正常"), ("Binance JP", "行情1秒 / 盘口1秒 / 账户30秒", "正常"), ("邀请奖励", "下线模拟收益 5%", "可编辑")]):
        yy = ty + 438 + i * 36
        text(d, (rx + 18, yy), row[0], C["text"], F["tiny"])
        text(d, (rx + 130, yy), row[1], C["muted"], F["tiny"])
        text(d, (rx + 360, yy), row[2], C["green"], F["tiny"])

    rect(d, (rx, ty + 582, rx + rw, ty + th + 18 + 318), C["panel"], C["border"], 8)
    text(d, (rx + 18, ty + 600), "资金流水 / 审计", C["text"], F["h"])
    ledger = [
        ("16:30", "模拟收益入账", "U10081", "+¥16,800"),
        ("16:28", "本金解冻", "U10081", "+¥75,000"),
        ("16:26", "本金冻结", "U10081", "-¥75,000"),
        ("16:18", "邀请奖励入账", "U10092", "+¥1,200"),
        ("15:11", "人工入账审批", "U10077", "待二审"),
    ]
    for i, row in enumerate(ledger):
        yy = ty + 644 + i * 34
        text(d, (rx + 18, yy), row[0], C["muted"], F["tiny"])
        text(d, (rx + 78, yy), row[1], C["text"], F["tiny"])
        text(d, (rx + 220, yy), row[2], C["muted"], F["tiny"])
        text(d, (rx + 322, yy), row[3], C["green"] if "+" in row[3] else (C["red"] if "-" in row[3] else C["yellow"]), F["tiny"])

    rect(d, (cx, y + bh - 52, cx + cw, y + bh - 12), C["panel2"], C["border"], 6)
    text(d, (cx + 18, y + bh - 40), "后台核心链路：邮箱注册/KYC → 交易所API秒数/VIP利润概率/邀请返佣 → AI任务队列 → JPY资金账本 → 审计日志", C["muted"], F["xs"])

    path = OUT / "developer-admin-management-mockup.png"
    img.save(path)
    return path


if __name__ == "__main__":
    print(draw_customer())
    print(draw_admin())
