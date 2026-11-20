/**
 * Brand stroke icons (24px grid, 1.8px stroke). Paths come from
 * design/components/Icons, design/components/Alert and design/lm-icons.json.
 */
export const ICON_PATHS = {
  // Interface
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  chat: "M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z",
  calendar:
    "M6 4.5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3zM8 2.5v4M16 2.5v4M3 10h18",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM9.5 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0",
  contact:
    "M5 8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6",
  share:
    "M15.5 5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M3.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M15.5 19a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6",
  qr: "M4 3h6v7H3V4zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3",
  chart: "M5 20V11M12 20V5M19 20v-6",
  plus: "M12 5v14M5 12h14",
  edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  lock: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  check: "m5 12 5 5 9-10",
  arrow: "M7 17 17 7M8 7h9v9",
  search: "M4 11a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M20 20l-3.5-3.5",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  external:
    "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  copy: "M8 8h12v12H8zM4 16V4h12",
  palette:
    "M12 3a9 9 0 1 0 0 18c.9 0 1.5-.6 1.5-1.4 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.4 1.5-1.4H16a5 5 0 0 0 5-5c0-4.3-4-8-9-8zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01M17 11h.01",
  bag: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  info: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 11v5M12 8h.01",
  warning: "M12 4 2.5 20h19zM12 10v4M12 17h.01",
  close: "M6 6l12 12M18 6 6 18",
  // Link icons (lm:<name>)
  phone:
    "M5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 7 7l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z",
  mail: "M6 5h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM3.5 7l8.5 6 8.5-6",
  map: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM9.5 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0",
  shop: "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2",
  menu: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8",
  catalog:
    "M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z",
  portfolio: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15 9h.01",
  site: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  payment: "M3 6h18v12H3zM3 10h18M7 15h3",
  coupon: "M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9zM7.5 7.5h.01",
  reviews:
    "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  pdf: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  ticket: "M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3zM14 4v16",
  linkedin:
    "M4 8h16v11H4zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M4 13h16",
  kwai: "M4 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4zM18 10l3-2v8l-3-2",
} as const;

export type IconName = keyof typeof ICON_PATHS;
