/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, ShieldAlert, ShieldCheck, Download, Sparkles, Globe, Lock, Unlock,
  Plus, X, ChevronLeft, ChevronRight, RotateCw, Star, Settings, History,
  Bookmark, Menu, Play, FileText, Film, Music, Image as ImageIcon, Moon, QrCode,
  CheckCircle, AlertTriangle, Cpu, Eye, EyeOff, ExternalLink, Trash2,
  Pause, Check, Terminal, HelpCircle, HardDrive, Zap, Info, Pin, Copy,
  Folder, FolderOpen, ChevronDown, ChevronUp, User, Smartphone, Laptop,
  Key, RefreshCw, Layers, ShieldCheck as ShieldKey, Search, Battery,
  BatteryCharging, Puzzle, Upload, BookOpen, LayoutGrid, Cloud,
  Volume2, VolumeX, Sun, Monitor, Edit3, Camera, PieChart, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';

interface Tab {
  id: string;
  url: string;
  title: string;
  customTitle?: string;
  isPrivate: boolean;
  shieldsUp: boolean;
  blockedCount: number;
  mediaFiles: MediaItem[];
  history: string[];
  historyIndex: number;
  isPinned?: boolean;
  groupId?: string;
  isReadingMode?: boolean;
  isMuted?: boolean;
  isAudioPlaying?: boolean;
  isHibernated?: boolean;
}

interface TabGroup {
  id: string;
  name: string;
  color: string;
  isCollapsed: boolean;
}

interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'document';
  size: string;
  url: string;
  resolution?: string;
  speed?: string;
  progress: number;
  status: 'sniffed' | 'downloading' | 'completed' | 'paused';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface BrowserProfile {
  id: string;
  name: string;
  icon: string;
}

interface PasswordItem {
  id: string;
  site: string;
  username: string;
  pass: string;
}

interface SyncedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastSync: string;
}

interface ExtensionItem {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  author: string;
}

const DEFAULT_TABS: Tab[] = [
  {
    id: '1',
    url: 'umbra://newtab',
    title: 'New Tab',
    isPrivate: false,
    shieldsUp: true,
    blockedCount: 0,
    mediaFiles: [],
    history: ['umbra://newtab'],
    historyIndex: 0,
    isAudioPlaying: true // Demo audio playing tab
  }
];

const CURATED_SITES = [
  { title: 'Privacy Dashboard', url: 'umbra://privacy-dashboard', icon: PieChart, desc: 'Summary of blocked trackers, total bandwidth, and time saved' },
  { title: 'Umbra Privacy Demo', url: 'umbra://demo', icon: Shield, desc: 'Test ad-blocking, tracker detection, and Umbra Media Sniffer' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: Globe, desc: 'Tech news & discussions (Reading Mode ready)' },
  { title: 'Wikipedia', url: 'https://en.wikipedia.org', icon: Globe, desc: 'The free encyclopedia' },
  { title: 'Simulated Media Stream', url: 'umbra://media-demo', icon: Film, desc: 'Test Umbra Media Sniffer with video & audio streams' },
];

// D3.js 7-Day Blocked Trackers Chart Component
function BlockersChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const container = chartRef.current;
    container.innerHTML = '';

    const data = [
      { day: 'Mon', count: 24 },
      { day: 'Tue', count: 38 },
      { day: 'Wed', count: 19 },
      { day: 'Thu', count: 45 },
      { day: 'Fri', count: 52 },
      { day: 'Sat', count: 60 },
      { day: 'Sun', count: 41 },
    ];

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 450 - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.day))
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, 70])
      .range([height, 0]);

    // X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', '#e5e5e5')
      .style('font-size', '11px');

    // Y axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .selectAll('text')
      .style('fill', '#e5e5e5')
      .style('font-size', '11px');

    // Bars
    svg.selectAll('mybar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.day)!)
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#fca311')
      .attr('rx', 6);

    // Values on top of bars
    svg.selectAll('mytext')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(d.day)! + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#ffffff')
      .style('font-size', '10px')
      .text(d => d.count);

  }, []);

  return <div ref={chartRef} className="w-full flex justify-center py-4 overflow-x-auto" />;
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [inputUrl, setInputUrl] = useState<string>('umbra://newtab');
  
  // Search Engine Preference (default: google)
  const [searchEngine, setSearchEngine] = useState<'google' | 'duckduckgo' | 'bing' | 'brave' | 'yahoo'>('google');

  // Battery Status
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [isCharging, setIsCharging] = useState<boolean>(true);

  // Tab Search modal (Ctrl+Shift+A)
  const [isTabSearchOpen, setIsTabSearchOpen] = useState<boolean>(false);
  const [tabSearchQuery, setTabSearchQuery] = useState<string>('');

  // Dropdown Menu (hamburger menu)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Panels & State
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isShieldsModalOpen, setIsShieldsModalOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'theme' | 'search' | 'privacy' | 'sync' | 'profiles' | 'passwords' | 'sniffer' | 'extensions'>('general');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);

  // Theme Mode ('dark' | 'light' | 'system')
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark');
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);

  // Find in Page state
  const [isFindInPageOpen, setIsFindInPageOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [matchCount, setMatchCount] = useState<number>(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const findMatchesRef = useRef<HTMLElement[]>([]);
  const findInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Chromium Extensions State
  const [extensions, setExtensions] = useState<ExtensionItem[]>([
    { id: 'ext1', name: 'uBlock Origin (Chromium)', version: '1.58.0', description: 'Fast and lean blocker. Safe memory and CPU.', enabled: true, author: 'gorhill' },
    { id: 'ext2', name: 'Umbra Privacy Shield', version: '2.4.1', description: 'Advanced anti-fingerprinting and cross-site cookie defense.', enabled: true, author: 'Umbra' },
    { id: 'ext3', name: 'Dark Reader', version: '4.9.45', description: 'Dark mode for every website. Care for your eyes.', enabled: false, author: 'Dark Reader Team' }
  ]);
  const [customExtName, setCustomExtName] = useState<string>('');

  // Hover preview tab state
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  // Browser Profiles
  const [profiles, setProfiles] = useState<BrowserProfile[]>([
    { id: 'p1', name: 'Default Profile', icon: 'User' },
    { id: 'p2', name: 'Work & Research', icon: 'Laptop' },
    { id: 'p3', name: 'Personal Vault', icon: 'Shield' }
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>('p1');
  const [newProfileName, setNewProfileName] = useState<string>('');

  // Password Manager & Autofill
  const [passwords, setPasswords] = useState<PasswordItem[]>([
    { id: 'pwd1', site: 'github.com', username: 'umbra_dev', pass: '••••••••••••' },
    { id: 'pwd2', site: 'proton.me', username: 'privacy_user@umbra', pass: '••••••••••••' }
  ]);
  const [isPasswordVaultLocked, setIsPasswordVaultLocked] = useState<boolean>(true);
  const [masterPasswordInput, setMasterPasswordInput] = useState<string>('');
  const [autofillEnabled, setAutofillEnabled] = useState<boolean>(true);

  // Device Sync & Manual Cloud Sync
  const [syncedDevices, setSyncedDevices] = useState<SyncedDevice[]>([
    { id: 'dev1', name: 'MacBook Pro 16" (Desktop)', type: 'desktop', lastSync: 'Just now' },
    { id: 'dev2', name: 'Umbra Mobile (iPhone 16 Pro)', type: 'mobile', lastSync: '3 mins ago' },
    { id: 'dev3', name: 'iPad Air M2', type: 'tablet', lastSync: '1 hour ago' }
  ]);
  const [deviceSyncEnabled, setDeviceSyncEnabled] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string>('Synced');

  // Auto-enable reading mode on news sites setting
  const [autoReadingModeNews, setAutoReadingModeNews] = useState<boolean>(true);

  // Memory Saver state
  const [memorySaverEnabled, setMemorySaverEnabled] = useState<boolean>(true);

  // Battery Saver state
  const [batterySaverEnabled, setBatterySaverEnabled] = useState<boolean>(false);

  // Domain specific zoom map & QR Share modal state
  const [domainZoomMap, setDomainZoomMap] = useState<Record<string, number>>({});
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Reading Mode theme preference ('light' | 'sepia' | 'dark')
  const [readingModeTheme, setReadingModeTheme] = useState<'light' | 'sepia' | 'dark'>('dark');

  // Screenshot capture state & trigger
  const [isScreenshotCapturing, setIsScreenshotCapturing] = useState<boolean>(false);

  const handleTakeScreenshot = () => {
    setIsScreenshotCapturing(true);
    setTimeout(() => setIsScreenshotCapturing(false), 300);

    const canvas = document.createElement('canvas');
    const width = 1280;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background
      ctx.fillStyle = isDark ? '#000000' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw header chrome strip
      ctx.fillStyle = '#14213d';
      ctx.fillRect(0, 0, width, 80);

      // Umbra Watermark & Snapshot Info
      ctx.fillStyle = '#fca311';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Umbra Browser Snapshot', 24, 35);

      ctx.fillStyle = '#e5e5e5';
      ctx.font = '12px monospace';
      ctx.fillText(`URL: ${activeTab.url}`, 24, 60);

      // Webpage / Tab snapshot body container
      ctx.fillStyle = isDark ? '#14213d' : '#f0f4f8';
      ctx.fillRect(24, 105, width - 48, height - 130);

      const displayTitle = activeTab.customTitle || activeTab.title || 'New Tab';
      ctx.fillStyle = isDark ? '#ffffff' : '#14213d';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(displayTitle, 48, 150);

      ctx.fillStyle = '#fca311';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Shields Status: ${activeTab.shieldsUp ? 'UP (Active)' : 'DOWN'} | Intercepted: ${activeTab.blockedCount} items`, 48, 185);

      ctx.fillStyle = isDark ? '#e5e5e5' : '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Captured on ${new Date().toLocaleString()}`, 48, 215);

      // Draw mock article/preview placeholder lines
      ctx.fillStyle = isDark ? '#263352' : '#cbd5e1';
      for (let i = 0; i < 9; i++) {
        const rowY = 260 + i * 36;
        const rowW = (width - 120) * (0.55 + (i % 3) * 0.15);
        ctx.fillRect(48, rowY, rowW, 14);
      }

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `umbra_screenshot_${Date.now()}.png`;
        a.click();
      } catch (err) {
        console.error('Screenshot download failed:', err);
      }
    }
  };

  const currentDomain = (() => {
    const tab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const url = tab ? tab.url : 'umbra://newtab';
    try {
      if (url.startsWith('umbra://')) return url;
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  const currentZoom = domainZoomMap[currentDomain] || 100;

  const handleZoomChange = (delta: number) => {
    setDomainZoomMap(prev => {
      const current = prev[currentDomain] || 100;
      const nextZoom = Math.min(300, Math.max(50, current + delta));
      return { ...prev, [currentDomain]: nextZoom };
    });
  };

  const resetZoom = () => {
    setDomainZoomMap(prev => ({ ...prev, [currentDomain]: 100 }));
  };

  const switchToTab = (id: string) => {
    setTabs(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isHibernated: false };
      }
      if (memorySaverEnabled && !t.isPinned && !t.isAudioPlaying) {
        return { ...t, isHibernated: true };
      }
      return t;
    }));
    setActiveTabId(id);
  };

  // Drag and drop tab grouping & reordering state with ghosting feedback
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Group Tab modal state
  const [groupTabModal, setGroupTabModal] = useState<{
    isOpen: boolean;
    tabId: string;
    groupName: string;
    groupColor: string;
    selectedExistingGroupId: string;
  }>({
    isOpen: false,
    tabId: '',
    groupName: 'Work Session',
    groupColor: '#fca311',
    selectedExistingGroupId: ''
  });

  // Tab Rename modal state
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    tabId: string;
    title: string;
  }>({ isOpen: false, tabId: '', title: '' });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
  }>({ visible: false, x: 0, y: 0, tabId: '' });

  // Global stats
  const [totalBlocked, setTotalBlocked] = useState<number>(142);
  const [bandwidthSaved, setBandwidthSaved] = useState<string>('28.4 MB');
  const [timeSaved, setTimeSaved] = useState<string>('4.2 mins');

  // Downloads state (Umbra Media Sniffer)
  const [downloads, setDownloads] = useState<MediaItem[]>([
    {
      id: 'd1',
      name: 'Umbra_Security_Whitepaper_2026.pdf',
      type: 'document',
      size: '14.2 MB',
      url: 'https://example.com/whitepaper.pdf',
      progress: 100,
      status: 'completed'
    },
    {
      id: 'd2',
      name: '4K_Cinematic_Reel.mp4',
      type: 'video',
      size: '185.0 MB',
      url: 'https://example.com/reel.mp4',
      resolution: '4K 60FPS',
      speed: '12.4 MB/s',
      progress: 68,
      status: 'downloading'
    }
  ]);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; url: string }>>([
    { title: 'Umbra Home', url: 'umbra://newtab' },
    { title: 'Privacy Test', url: 'umbra://demo' },
    { title: 'Hacker News', url: 'https://news.ycombinator.com' },
    { title: 'Wikipedia', url: 'https://en.wikipedia.org' },
  ]);

  // Search suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Umbra AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am Umbra AI, your built-in assistant. How can I help you browse privately, analyze trackers, or manage your downloads today?' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Settings state
  const [settings, setSettings] = useState({
    blockAds: true,
    blockTrackers: true,
    blockCookies: true,
    httpsOnly: true,
    fingerprintProtection: true,
    mediaSniffer: true,
    aiModel: 'gemini-2.5-flash',
    theme: 'dark'
  });

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    setInputUrl(activeTab.url);
  }, [activeTabId, activeTab.url]);

  // Battery API integration
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      }).catch(() => {});
    }
  }, []);

  // Find in Page Execution and Highlight Management
  const clearFindHighlights = () => {
    if (!viewportRef.current) return;
    const marks = viewportRef.current.querySelectorAll('mark.umbra-find-match');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    findMatchesRef.current = [];
  };

  const executeFind = (query: string) => {
    if (!viewportRef.current) return;
    clearFindHighlights();

    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }

    const container = viewportRef.current;
    const matches: HTMLElement[] = [];
    const regex = new RegExp(`(${cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (
            parent.closest('.find-in-page-bar') ||
            parent.closest('button') ||
            parent.tagName === 'SCRIPT' ||
            parent.tagName === 'STYLE' ||
            parent.tagName === 'INPUT' ||
            parent.tagName === 'TEXTAREA'
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return regex.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    for (const node of textNodes) {
      const text = node.nodeValue;
      if (!text) continue;
      const parent = node.parentNode;
      if (!parent) continue;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      regex.lastIndex = 0;

      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        }
        const mark = document.createElement('mark');
        mark.className = 'umbra-find-match';
        mark.textContent = match[0];
        fragment.appendChild(mark);
        matches.push(mark);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      parent.replaceChild(fragment, node);
    }

    findMatchesRef.current = matches;
    setMatchCount(matches.length);
    setCurrentMatchIndex(0);

    if (matches.length > 0) {
      matches[0].classList.add('active-match');
      matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFindNext = () => {
    if (findMatchesRef.current.length === 0) return;
    const total = findMatchesRef.current.length;
    findMatchesRef.current[currentMatchIndex]?.classList.remove('active-match');
    const nextIdx = (currentMatchIndex + 1) % total;
    setCurrentMatchIndex(nextIdx);
    const activeEl = findMatchesRef.current[nextIdx];
    if (activeEl) {
      activeEl.classList.add('active-match');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFindPrev = () => {
    if (findMatchesRef.current.length === 0) return;
    const total = findMatchesRef.current.length;
    findMatchesRef.current[currentMatchIndex]?.classList.remove('active-match');
    const prevIdx = (currentMatchIndex - 1 + total) % total;
    setCurrentMatchIndex(prevIdx);
    const activeEl = findMatchesRef.current[prevIdx];
    if (activeEl) {
      activeEl.classList.add('active-match');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Find in page effect
  useEffect(() => {
    if (!isFindInPageOpen) {
      clearFindHighlights();
      setFindQuery('');
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }
    const timer = setTimeout(() => {
      executeFind(findQuery);
    }, 80);
    return () => clearTimeout(timer);
  }, [findQuery, isFindInPageOpen, activeTabId]);

  // Global Keyboard Shortcuts (Ctrl+Shift+A for Tab Search, Ctrl+F for Find in Page)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsTabSearchOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindInPageOpen(true);
        setTimeout(() => {
          findInputRef.current?.focus();
          findInputRef.current?.select();
        }, 50);
      } else if (e.key === 'Escape') {
        if (isFindInPageOpen) {
          setIsFindInPageOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFindInPageOpen]);

  // Search suggestions debounce effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!inputUrl || inputUrl.startsWith('umbra://') || inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (inputUrl.trim().length > 0) {
        try {
          const res = await fetch(`/api/suggestions?q=${encodeURIComponent(inputUrl)}`);
          const data = await res.json();
          const phrases = Array.isArray(data) ? data.map((item: any) => item.phrase).filter(Boolean) : [];
          setSuggestions(phrases.slice(0, 6));
          setShowSuggestions(phrases.length > 0);
        } catch (err) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputUrl]);

  // Export Bookmarks as HTML
  const exportBookmarksHtml = () => {
    const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Umbra Bookmarks Backup</TITLE>
<h1>Bookmarks</h1>
<dl><p>
${bookmarks.map(b => `    <dt><a href="${b.url}">${b.title}</a></dt>`).join('\n')}
</dl><p>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'umbra_bookmarks_backup.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Password CSV Template
  const downloadPasswordTemplate = () => {
    const csvContent = "url,username,password\nhttps://example.com,my_user,my_secure_password";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'umbra_passwords_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Passwords from CSV
  const handlePasswordCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').slice(1);
      const newPasswords: PasswordItem[] = [];
      lines.forEach((line, idx) => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          newPasswords.push({
            id: 'import_' + Date.now() + '_' + idx,
            site: parts[0].trim(),
            username: parts[1].trim(),
            pass: parts[2].trim()
          });
        }
      });
      if (newPasswords.length > 0) {
        setPasswords(prev => [...prev, ...newPasswords]);
        alert(`Successfully imported ${newPasswords.length} passwords from CSV!`);
      } else {
        alert('Could not parse valid passwords from CSV file.');
      }
    };
    reader.readAsText(file);
  };

  // Manual Cloud Sync handler
  const handleManualCloudSync = () => {
    setSyncStatus('Syncing profile...');
    setTimeout(() => {
      setSyncedDevices(prev => prev.map(d => ({ ...d, lastSync: 'Just now' })));
      setSyncStatus('Synced successfully');
      setTimeout(() => setSyncStatus('Synced'), 3000);
    }, 1200);
  };

  // Toggle Tab Mute / Unmute
  const toggleMuteTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isMuted: !t.isMuted, isAudioPlaying: t.isMuted } : t));
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const navigateTo = (urlOrQuery: string, isPrivate = false) => {
    let finalQuery = urlOrQuery.trim();
    if (!finalQuery) return;

    let targetUrl = finalQuery;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('umbra://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        switch (searchEngine) {
          case 'google':
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            break;
          case 'duckduckgo':
            targetUrl = `https://duckduckgo.com/?q=${encodeURIComponent(targetUrl)}`;
            break;
          case 'bing':
            targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(targetUrl)}`;
            break;
          case 'brave':
            targetUrl = `https://search.brave.com/search?q=${encodeURIComponent(targetUrl)}`;
            break;
          case 'yahoo':
            targetUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(targetUrl)}`;
            break;
          default:
            targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
        }
      }
    }

    const isNewsSite = targetUrl.includes('news') || targetUrl.includes('ycombinator') || targetUrl.includes('blog') || targetUrl.includes('article');
    const shouldAutoRead = autoReadingModeNews && isNewsSite;

    setTabs(prev => prev.map(tab => {
      if (tab.id === activeTabId) {
        const newHistory = tab.history.slice(0, tab.historyIndex + 1);
        newHistory.push(targetUrl);
        
        let blockedCount = tab.blockedCount;
        let mediaFiles = [...tab.mediaFiles];

        if (targetUrl.includes('demo') || targetUrl.includes('media-demo') || targetUrl.startsWith('http')) {
          blockedCount += Math.floor(Math.random() * 8) + 3;
          setTotalBlocked(prev => prev + (blockedCount - tab.blockedCount));
        }

        if (targetUrl.includes('media-demo') || targetUrl.includes('youtube')) {
          mediaFiles = [
            { id: Date.now() + '1', name: 'Cinematic_Trailer_1080p.mp4', type: 'video', size: '45.2 MB', url: targetUrl, resolution: '1080p', progress: 0, status: 'sniffed' },
            { id: Date.now() + '2', name: 'Ambient_Soundtrack.mp3', type: 'audio', size: '8.4 MB', url: targetUrl, resolution: '320kbps', progress: 0, status: 'sniffed' },
            { id: Date.now() + '3', name: 'Ultra_Wallpaper.jpg', type: 'image', size: '1.2 MB', url: targetUrl, resolution: '3840x2160', progress: 0, status: 'sniffed' }
          ];
        }

        return {
          ...tab,
          url: targetUrl,
          title: targetUrl.replace('https://', '').replace('http://', ''),
          isPrivate: isPrivate || tab.isPrivate,
          blockedCount,
          mediaFiles,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isReadingMode: shouldAutoRead
        };
      }
      return tab;
    }));
  };

  const createNewTab = (isPrivate = false) => {
    const newId = Date.now().toString();
    const newTab: Tab = {
      id: newId,
      url: 'umbra://newtab',
      title: isPrivate ? 'Private Window' : 'New Tab',
      isPrivate,
      shieldsUp: true,
      blockedCount: 0,
      mediaFiles: [],
      history: ['umbra://newtab'],
      historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const index = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[Math.max(0, index - 1)].id);
    }
  };

  const goBack = () => {
    if (activeTab.historyIndex > 0) {
      const newIndex = activeTab.historyIndex - 1;
      const targetUrl = activeTab.history[newIndex];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: targetUrl, historyIndex: newIndex, title: targetUrl } : t));
    }
  };

  const goForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
      const newIndex = activeTab.historyIndex + 1;
      const targetUrl = activeTab.history[newIndex];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: targetUrl, historyIndex: newIndex, title: targetUrl } : t));
    }
  };

  const reloadTab = () => {
    navigateTo(activeTab.url);
  };

  const toggleShields = () => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, shieldsUp: !t.shieldsUp } : t));
  };

  const togglePinTab = (id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const duplicateTab = (id: string) => {
    const tabToDup = tabs.find(t => t.id === id);
    if (!tabToDup) return;
    const newId = Date.now().toString();
    const newTab: Tab = {
      ...tabToDup,
      id: newId,
      history: [...tabToDup.history],
      isPinned: false,
      customTitle: tabToDup.customTitle ? `${tabToDup.customTitle} (Copy)` : undefined
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const openRenameTabModal = (id: string) => {
    const target = tabs.find(t => t.id === id);
    if (!target) return;
    setRenameModal({
      isOpen: true,
      tabId: id,
      title: target.customTitle || target.title
    });
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const handleSaveTabRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = renameModal.title.trim();
    setTabs(prev => prev.map(t => {
      if (t.id === renameModal.tabId) {
        return {
          ...t,
          customTitle: trimmed.length > 0 ? trimmed : undefined
        };
      }
      return t;
    }));
    setRenameModal({ isOpen: false, tabId: '', title: '' });
  };

  const handleResetTabRename = () => {
    setTabs(prev => prev.map(t => {
      if (t.id === renameModal.tabId) {
        return {
          ...t,
          customTitle: undefined
        };
      }
      return t;
    }));
    setRenameModal({ isOpen: false, tabId: '', title: '' });
  };

  const closeAllOthers = (id: string) => {
    setTabs(prev => prev.filter(t => t.id === id || t.isPinned));
    setActiveTabId(id);
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const openGroupTabModal = (id: string) => {
    const target = tabs.find(t => t.id === id);
    if (!target) return;
    setGroupTabModal({
      isOpen: true,
      tabId: id,
      groupName: 'Work Session',
      groupColor: '#fca311',
      selectedExistingGroupId: tabGroups.length > 0 ? tabGroups[0].id : ''
    });
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const handleAssignTabToGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!groupTabModal.tabId) return;

    let targetGroupId = groupTabModal.selectedExistingGroupId;

    if (!targetGroupId) {
      targetGroupId = 'group_' + Date.now();
      const newGroup: TabGroup = {
        id: targetGroupId,
        name: groupTabModal.groupName.trim() || 'New Group',
        color: groupTabModal.groupColor,
        isCollapsed: false
      };
      setTabGroups(prev => [...prev, newGroup]);
    }

    setTabs(prev => prev.map(t => {
      if (t.id === groupTabModal.tabId) {
        return { ...t, groupId: targetGroupId };
      }
      return t;
    }));

    setGroupTabModal({
      isOpen: false,
      tabId: '',
      groupName: 'Work Session',
      groupColor: '#fca311',
      selectedExistingGroupId: ''
    });
  };

  const removeTabFromGroup = (id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, groupId: undefined } : t));
    setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
  };

  const toggleGroupCollapse = (groupId: string) => {
    setTabGroups(prev => prev.map(g => g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g));
  };

  const handleTabDrop = (e: React.DragEvent, targetTab: Tab) => {
    e.preventDefault();
    if (!draggedTabId || draggedTabId === targetTab.id) {
      setDraggedTabId(null);
      setDragOverTabId(null);
      return;
    }

    setTabs(prevTabs => {
      const sourceIndex = prevTabs.findIndex(t => t.id === draggedTabId);
      const targetIndex = prevTabs.findIndex(t => t.id === targetTab.id);
      if (sourceIndex === -1 || targetIndex === -1) return prevTabs;

      const newTabs = [...prevTabs];
      const [removed] = newTabs.splice(sourceIndex, 1);
      newTabs.splice(targetIndex, 0, removed);
      return newTabs;
    });
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const clearBrowsingData = () => {
    setTabs(DEFAULT_TABS);
    setActiveTabId('1');
    alert('Browsing history, cache, and cookies successfully cleared.');
  };

  const startDownload = (media: MediaItem) => {
    const newDownload: MediaItem = { ...media, id: 'dl_' + Date.now(), progress: 10, status: 'downloading', speed: '14.8 MB/s' };
    setDownloads(prev => [newDownload, ...prev]);
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          pageContext: { url: activeTab.url, title: activeTab.title, blockedCount: activeTab.blockedCount },
          history: chatMessages
        })
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error responding to your request.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: 'Network error connecting to Umbra AI assistant.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addCurrentBookmark = () => {
    if (!bookmarks.some(b => b.url === activeTab.url)) {
      setBookmarks(prev => [...prev, { title: activeTab.title, url: activeTab.url }]);
    }
  };

  const toggleReadingMode = () => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isReadingMode: !t.isReadingMode } : t));
  };

  const openSpecialTab = (url: string, title: string) => {
    const existing = tabs.find(t => t.url === url);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const newId = Date.now().toString();
    const newTab: Tab = {
      id: newId,
      url,
      title,
      isPrivate: false,
      shieldsUp: true,
      blockedCount: 0,
      mediaFiles: [],
      history: [url],
      historyIndex: 0
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const pinnedTabs = tabs.filter(t => t.isPinned);
  const unpinnedTabs = tabs.filter(t => !t.isPinned);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-200 ${
      isDark ? 'theme-dark bg-[#000000] text-[#ffffff]' : 'theme-light bg-[#ffffff] text-[#14213d]'
    }`}>
      
      {/* Top Browser Chrome Bar */}
      <div className="flex flex-col bg-[#14213d] border-b border-[#14213d]">
        
        {/* Tab Bar Row */}
        <div
          className="flex items-center justify-between px-2 pt-2 bg-[#14213d]"
          onClick={() => {
            if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
          }}
        >
          {/* Tabs Container with smooth Motion layout animations */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 pr-4">
            <AnimatePresence>
              {/* Pinned Tabs */}
              {pinnedTabs.map(tab => {
                const isActive = tab.id === activeTabId;
                const displayTitle = tab.customTitle || tab.title || 'New Tab';
                return (
                  <motion.div
                    key={tab.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => switchToTab(tab.id)}
                    onMouseEnter={() => setHoveredTabId(tab.id)}
                    onMouseLeave={() => setHoveredTabId(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabId: tab.id });
                    }}
                    title={`${displayTitle} (Pinned)${tab.isHibernated ? ' - Hibernated (RAM saved)' : ''}`}
                    className={`group relative flex items-center justify-center w-11 py-1.5 rounded-t-lg transition-all cursor-pointer text-xs ${
                      isActive
                        ? 'bg-[#000000] text-[#ffffff] border-t-2 border-[#fca311] shadow-sm'
                        : 'bg-[#14213d]/80 text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#ffffff]'
                    }`}
                  >
                    {tab.isHibernated ? (
                      <Moon className="w-3.5 h-3.5 text-[#fca311] animate-pulse" />
                    ) : tab.isPrivate ? (
                      <EyeOff className="w-3.5 h-3.5 text-[#fca311]" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-[#fca311]" />
                    )}
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#fca311]" />

                    {/* Audio Playing / Muted Speaker indicator */}
                    {(tab.isAudioPlaying || tab.isMuted) && (
                      <button
                        onClick={(e) => toggleMuteTab(tab.id, e)}
                        className="absolute -top-1 -right-1 bg-[#000000] text-[#fca311] p-0.5 rounded-full shadow hover:scale-110 transition-transform"
                        title={tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}
                      >
                        {tab.isMuted ? <VolumeX className="w-2.5 h-2.5 text-rose-400" /> : <Volume2 className="w-2.5 h-2.5" />}
                      </button>
                    )}

                    {hoveredTabId === tab.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#14213d] border border-[#fca311]/40 rounded-xl shadow-2xl p-3 z-50 pointer-events-none">
                        <div className="flex items-center justify-between text-[10px] text-[#fca311] mb-1">
                          <span className="font-semibold uppercase tracking-wider">Tab Preview</span>
                          <span className="truncate max-w-[120px]">{displayTitle}</span>
                        </div>
                        <div className="w-full h-28 bg-[#000000] rounded-lg border border-[#14213d] flex flex-col items-center justify-center p-2 text-center overflow-hidden relative">
                          <div className="absolute inset-0 opacity-15 bg-gradient-to-tr from-[#fca311] to-transparent" />
                          <Globe className="w-6 h-6 text-[#fca311] mb-1" />
                          <div className="text-[11px] font-bold text-[#ffffff] truncate max-w-full">{displayTitle}</div>
                          {tab.customTitle && (
                            <div className="text-[9px] text-[#fca311] truncate max-w-full font-mono mt-0.5">Original: {tab.title}</div>
                          )}
                          <div className="text-[9px] text-[#e5e5e5] truncate max-w-full font-mono mt-0.5">{tab.url}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Grouped Tabs */}
              {tabGroups.map(group => {
                const groupTabs = unpinnedTabs.filter(t => t.groupId === group.id);
                if (groupTabs.length === 0) return null;

                return (
                  <motion.div key={group.id} layout transition={{ duration: 0.2 }} className="flex items-center bg-[#14213d] rounded-t-lg border border-[#fca311]/20 mr-1 overflow-hidden">
                    <div
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer bg-[#14213d] hover:bg-[#14213d]/80 text-xs font-semibold text-[#ffffff] border-r border-[#000000]"
                      style={{ borderLeft: `3px solid ${group.color}` }}
                      title={`Group: ${group.name} (${groupTabs.length} tabs)`}
                    >
                      <span className="text-[#fca311]">{group.isCollapsed ? <Folder className="w-3.5 h-3.5" /> : <FolderOpen className="w-3.5 h-3.5" />}</span>
                      <span className="truncate max-w-[100px]">{group.name}</span>
                      <span className="text-[10px] bg-[#000000]/60 px-1.5 py-0.2 rounded-full text-[#e5e5e5]">{groupTabs.length}</span>
                      {group.isCollapsed ? <ChevronDown className="w-3 h-3 text-[#e5e5e5]" /> : <ChevronUp className="w-3 h-3 text-[#e5e5e5]" />}
                    </div>

                    {!group.isCollapsed && (
                      <div className="flex items-center gap-1 px-1">
                        {groupTabs.map(tab => {
                          const isActive = tab.id === activeTabId;
                          const isDragging = draggedTabId === tab.id;
                          const isDragTarget = dragOverTabId === tab.id && draggedTabId !== tab.id;
                          const displayTitle = tab.customTitle || tab.title || 'New Tab';

                          return (
                            <motion.div
                              key={tab.id}
                              layout
                              transition={{ duration: 0.2 }}
                              draggable
                              onDragStart={(e) => {
                                setDraggedTabId(tab.id);
                                const me = e as unknown as React.MouseEvent;
                                setDragPos({ x: me.clientX, y: me.clientY });
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                const me = e as unknown as React.MouseEvent;
                                setDragPos({ x: me.clientX, y: me.clientY });
                                if (draggedTabId && draggedTabId !== tab.id && dragOverTabId !== tab.id) {
                                  setDragOverTabId(tab.id);
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverTabId === tab.id) {
                                  setDragOverTabId(null);
                                }
                              }}
                              onDragEnd={() => {
                                setDraggedTabId(null);
                                setDragOverTabId(null);
                              }}
                              onDrop={(e) => handleTabDrop(e, tab)}
                              onClick={() => switchToTab(tab.id)}
                              onMouseEnter={() => setHoveredTabId(tab.id)}
                              onMouseLeave={() => setHoveredTabId(null)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabId: tab.id });
                              }}
                              title={`${displayTitle}${tab.isHibernated ? ' - Hibernated (RAM saved)' : ''}`}
                              className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg max-w-[180px] min-w-[120px] cursor-pointer text-xs transition-all ${
                                isDragging
                                  ? 'opacity-35 scale-95 border-2 border-dashed border-[#fca311] bg-[#14213d]/20 ring-1 ring-[#fca311]/40 shadow-inner'
                                  : isDragTarget
                                    ? 'border-l-4 border-l-[#fca311] bg-[#fca311]/20 ring-1 ring-[#fca311]/60 shadow-lg translate-x-1'
                                    : isActive
                                      ? 'bg-[#000000] text-[#ffffff] border-t-2 border-[#fca311] shadow-sm'
                                      : 'bg-[#14213d]/60 text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#ffffff]'
                              }`}
                            >
                              {/* Visual drop slot insertion indicator */}
                              {isDragTarget && (
                                <div className="absolute -left-1 top-1 bottom-1 w-1 bg-[#fca311] rounded-full shadow-[0_0_8px_#fca311] z-30 pointer-events-none animate-pulse" />
                              )}

                              {tab.isHibernated ? (
                                <span title="Tab hibernated to save RAM" className="shrink-0 flex items-center">
                                  <Moon className="w-3.5 h-3.5 text-[#fca311] animate-pulse" />
                                </span>
                              ) : tab.isPrivate ? (
                                <EyeOff className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
                              ) : (
                                <Globe className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
                              )}
                              <span className="truncate flex-1 font-medium flex items-center gap-1">
                                <span className="truncate">{displayTitle}</span>
                                {tab.customTitle && (
                                  <span title="Custom tab title" className="shrink-0 text-[#fca311]">
                                    <Edit3 className="w-2.5 h-2.5 opacity-75" />
                                  </span>
                                )}
                              </span>

                              {/* Audio Playing / Muted Speaker indicator */}
                              {(tab.isAudioPlaying || tab.isMuted) && (
                                <button
                                  onClick={(e) => toggleMuteTab(tab.id, e)}
                                  className="text-[#fca311] hover:scale-110 transition-transform p-0.5"
                                  title={tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}
                                >
                                  {tab.isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                                </button>
                              )}

                              {tab.mediaFiles.length > 0 && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fca311] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fca311]" title={`${tab.mediaFiles.length} media files detected`}></span>
                                </span>
                              )}
                              {tabs.length > 1 && (
                                <button
                                  onClick={(e) => closeTab(tab.id, e)}
                                  className="p-0.5 rounded-full hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
                                  title="Close Tab"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}

                              {hoveredTabId === tab.id && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#14213d] border border-[#fca311]/40 rounded-xl shadow-2xl p-3 z-50 pointer-events-none">
                                  <div className="flex items-center justify-between text-[10px] text-[#fca311] mb-1">
                                    <span className="font-semibold uppercase tracking-wider">Tab Preview</span>
                                    <span className="truncate max-w-[120px]">{displayTitle}</span>
                                  </div>
                                  <div className="w-full h-28 bg-[#000000] rounded-lg border border-[#14213d] flex flex-col items-center justify-center p-2 text-center overflow-hidden relative">
                                    <div className="absolute inset-0 opacity-15 bg-gradient-to-tr from-[#fca311] to-transparent" />
                                    <Globe className="w-6 h-6 text-[#fca311] mb-1" />
                                    <div className="text-[11px] font-bold text-[#ffffff] truncate max-w-full">{displayTitle}</div>
                                    {tab.customTitle && (
                                      <div className="text-[9px] text-[#fca311] truncate max-w-full font-mono mt-0.5">Original: {tab.title}</div>
                                    )}
                                    <div className="text-[9px] text-[#e5e5e5] truncate max-w-full font-mono mt-0.5">{tab.url}</div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Ungrouped Unpinned Tabs */}
              {unpinnedTabs.filter(t => !t.groupId).map(tab => {
                const isActive = tab.id === activeTabId;
                const isDragging = draggedTabId === tab.id;
                const isDragTarget = dragOverTabId === tab.id && draggedTabId !== tab.id;
                const displayTitle = tab.customTitle || tab.title || 'New Tab';

                return (
                  <motion.div
                    key={tab.id}
                    layout
                    transition={{ duration: 0.2 }}
                    draggable
                    onDragStart={(e) => {
                      setDraggedTabId(tab.id);
                      const me = e as unknown as React.MouseEvent;
                      setDragPos({ x: me.clientX, y: me.clientY });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const me = e as unknown as React.MouseEvent;
                      setDragPos({ x: me.clientX, y: me.clientY });
                      if (draggedTabId && draggedTabId !== tab.id && dragOverTabId !== tab.id) {
                        setDragOverTabId(tab.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTabId === tab.id) {
                        setDragOverTabId(null);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedTabId(null);
                      setDragOverTabId(null);
                    }}
                    onDrop={(e) => handleTabDrop(e, tab)}
                    onClick={() => switchToTab(tab.id)}
                    onMouseEnter={() => setHoveredTabId(tab.id)}
                    onMouseLeave={() => setHoveredTabId(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabId: tab.id });
                    }}
                    title={`${displayTitle}${tab.isHibernated ? ' - Hibernated (RAM saved)' : ''}`}
                    className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg max-w-[220px] min-w-[140px] cursor-pointer text-xs transition-all ${
                      isDragging
                        ? 'opacity-35 scale-95 border-2 border-dashed border-[#fca311] bg-[#14213d]/20 ring-1 ring-[#fca311]/40 shadow-inner'
                        : isDragTarget
                          ? 'border-l-4 border-l-[#fca311] bg-[#fca311]/20 ring-1 ring-[#fca311]/60 shadow-lg translate-x-1'
                          : isActive
                            ? 'bg-[#000000] text-[#ffffff] border-t-2 border-[#fca311] shadow-sm'
                            : 'bg-[#14213d]/60 text-[#e5e5e5] hover:bg-[#14213d] hover:text-[#ffffff]'
                    }`}
                  >
                    {/* Visual drop slot insertion indicator */}
                    {isDragTarget && (
                      <div className="absolute -left-1 top-1 bottom-1 w-1 bg-[#fca311] rounded-full shadow-[0_0_8px_#fca311] z-30 pointer-events-none animate-pulse" />
                    )}

                    {tab.isHibernated ? (
                      <span title="Tab hibernated to save RAM" className="shrink-0 flex items-center">
                        <Moon className="w-3.5 h-3.5 text-[#fca311] animate-pulse" />
                      </span>
                    ) : tab.isPrivate ? (
                      <EyeOff className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
                    )}
                    <span className="truncate flex-1 font-medium flex items-center gap-1">
                      <span className="truncate">{displayTitle}</span>
                      {tab.customTitle && (
                        <span title="Custom tab title" className="shrink-0 text-[#fca311]">
                          <Edit3 className="w-2.5 h-2.5 opacity-75" />
                        </span>
                      )}
                    </span>

                    {/* Audio Playing / Muted Speaker indicator */}
                    {(tab.isAudioPlaying || tab.isMuted) && (
                      <button
                        onClick={(e) => toggleMuteTab(tab.id, e)}
                        className="text-[#fca311] hover:scale-110 transition-transform p-0.5"
                        title={tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}
                      >
                        {tab.isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    )}

                    {tab.mediaFiles.length > 0 && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fca311] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fca311]" title={`${tab.mediaFiles.length} media files detected`}></span>
                      </span>
                    )}
                    {tabs.length > 1 && (
                      <button
                        onClick={(e) => closeTab(tab.id, e)}
                        className="p-0.5 rounded-full hover:bg-[#14213d] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
                        title="Close Tab"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {hoveredTabId === tab.id && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#14213d] border border-[#fca311]/40 rounded-xl shadow-2xl p-3 z-50 pointer-events-none">
                        <div className="flex items-center justify-between text-[10px] text-[#fca311] mb-1">
                          <span className="font-semibold uppercase tracking-wider">Tab Preview</span>
                          <span className="truncate max-w-[120px]">{displayTitle}</span>
                        </div>
                        <div className="w-full h-28 bg-[#000000] rounded-lg border border-[#14213d] flex flex-col items-center justify-center p-2 text-center overflow-hidden relative">
                          <div className="absolute inset-0 opacity-15 bg-gradient-to-tr from-[#fca311] to-transparent" />
                          <Globe className="w-6 h-6 text-[#fca311] mb-1" />
                          <div className="text-[11px] font-bold text-[#ffffff] truncate max-w-full">{displayTitle}</div>
                          {tab.customTitle && (
                            <div className="text-[9px] text-[#fca311] truncate max-w-full font-mono mt-0.5">Original: {tab.title}</div>
                          )}
                          <div className="text-[9px] text-[#e5e5e5] truncate max-w-full font-mono mt-0.5">{tab.url}</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <button
              onClick={() => createNewTab(false)}
              className="p-1.5 ml-1 rounded-lg hover:bg-[#14213d] text-[#e5e5e5] hover:text-[#ffffff] transition-colors shrink-0"
              title="New Tab"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsTabSearchOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#fca311] hover:text-[#fca311]/80 transition-colors flex items-center gap-1 text-xs shrink-0"
              title="Search Tabs (Ctrl+Shift+A)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => createNewTab(true)}
              className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#fca311] hover:text-[#fca311]/80 transition-colors flex items-center gap-1 text-xs shrink-0"
              title="New Private Window"
            >
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Private</span>
            </button>
          </div>

          {/* Right Side of Tab Bar: Battery, Shields, Umbra AI */}
          <div className="flex items-center gap-2 pl-2 shrink-0">
            {/* Battery Status Indicator */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#000000] text-[#fca311] text-xs border border-[#14213d]" title={`Battery: ${batteryLevel}% ${isCharging ? '(Charging)' : ''}`}>
              {isCharging ? <BatteryCharging className="w-3.5 h-3.5" /> : <Battery className="w-3.5 h-3.5" />}
              <span className="font-mono text-[11px]">{batteryLevel}%</span>
            </div>

            {/* Umbra Shields Button */}
            <button
              onClick={() => setIsShieldsModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab.shieldsUp
                  ? 'bg-[#000000] text-[#fca311] border border-[#fca311]/30 hover:bg-[#000000]/80'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
              }`}
              title="Umbra Shields Control"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Umbra Shields</span>
              <span className="bg-[#14213d] px-1.5 py-0.2 rounded-full text-[10px] text-[#fca311]">
                {activeTab.blockedCount}
              </span>
            </button>

            {/* Umbra AI Assistant Button */}
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isAiOpen
                  ? 'bg-[#fca311] text-[#000000] font-bold shadow-lg shadow-[#fca311]/20'
                  : 'bg-[#000000] text-[#fca311] border border-[#fca311]/30 hover:bg-[#000000]/80'
              }`}
              title="Umbra AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Umbra AI</span>
            </button>
          </div>
        </div>

        {/* Navigation & Omnibox Bar (with Reading Mode Button) */}
        <div className="flex items-center px-3 py-2 gap-2 bg-[#000000] border-t border-[#14213d]">
          <div className="flex items-center gap-1">
            <button
              onClick={goBack}
              disabled={activeTab.historyIndex === 0}
              className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#e5e5e5] disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goForward}
              disabled={activeTab.historyIndex >= activeTab.history.length - 1}
              className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#e5e5e5] disabled:opacity-45 disabled:hover:bg-transparent transition-colors"
              title="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={reloadTab}
              className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#e5e5e5] transition-colors"
              title="Reload"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Omnibox URL Input with Real-time Suggestions & Reading Mode Button */}
          <div className="relative flex-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSuggestions(false);
                navigateTo(inputUrl);
              }}
              className="flex items-center bg-[#14213d] border border-[#14213d] rounded-xl px-3 py-1.5 focus-within:border-[#fca311] focus-within:ring-1 focus-within:ring-[#fca311] transition-all"
            >
              {activeTab.isPrivate ? (
                <EyeOff className="w-4 h-4 text-[#fca311] mr-2 shrink-0" />
              ) : activeTab.url.startsWith('https://') ? (
                <Lock className="w-4 h-4 text-[#fca311] mr-2 shrink-0" />
              ) : activeTab.url.startsWith('umbra://') ? (
                <Shield className="w-4 h-4 text-[#fca311] mr-2 shrink-0" />
              ) : (
                <Unlock className="w-4 h-4 text-[#e5e5e5] mr-2 shrink-0" />
              )}
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full bg-transparent text-sm text-[#ffffff] focus:outline-none"
                placeholder={`Search ${searchEngine.toUpperCase()} or enter web address...`}
              />

              {/* Reading Mode Button in Omnibox */}
              <button
                type="button"
                onClick={toggleReadingMode}
                className={`p-1 rounded-md transition-colors mr-1 ${
                  activeTab.isReadingMode ? 'bg-[#fca311] text-[#000000]' : 'text-[#e5e5e5] hover:text-[#ffffff] hover:bg-[#000000]'
                }`}
                title={activeTab.isReadingMode ? 'Exit Reading Mode' : 'Enter Reading Mode (Distraction-free)'}
              >
                <BookOpen className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={addCurrentBookmark}
                className={`p-1 rounded-md hover:bg-[#000000] transition-colors ml-0.5 ${
                  bookmarks.some(b => b.url === activeTab.url) ? 'text-[#fca311]' : 'text-[#e5e5e5] hover:text-[#ffffff]'
                }`}
                title="Bookmark this tab"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>

              {/* Zoom Level Control Controls */}
              <div className="flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-[#000000] rounded-lg border border-[#14213d] text-[11px] text-[#e5e5e5]">
                <button
                  type="button"
                  onClick={() => handleZoomChange(-10)}
                  className="hover:text-[#ffffff] px-1 font-bold"
                  title="Zoom Out (-10%)"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="hover:text-[#fca311] font-mono px-0.5"
                  title="Reset Zoom to 100%"
                >
                  {currentZoom}%
                </button>
                <button
                  type="button"
                  onClick={() => handleZoomChange(10)}
                  className="hover:text-[#ffffff] px-1 font-bold"
                  title="Zoom In (+10%)"
                >
                  +
                </button>
              </div>

              {/* Take Screenshot Camera Button */}
              <button
                type="button"
                onClick={handleTakeScreenshot}
                className="p-1 rounded-md text-[#e5e5e5] hover:text-[#ffffff] hover:bg-[#000000] transition-colors ml-1"
                title="Take Screenshot of Current Tab (PNG)"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Share via QR Code Button */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="p-1 rounded-md text-[#e5e5e5] hover:text-[#ffffff] hover:bg-[#000000] transition-colors ml-1"
                title="Share via QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </form>

            {/* Real-time Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#14213d] border border-[#fca311]/30 rounded-xl shadow-2xl z-50 overflow-hidden">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setInputUrl(sug);
                      setShowSuggestions(false);
                      navigateTo(sug);
                    }}
                    className="px-4 py-2.5 hover:bg-[#000000] text-xs text-[#ffffff] cursor-pointer flex items-center justify-between transition-colors border-b border-[#000000]/40 last:border-0"
                  >
                    <span className="truncate">{sug}</span>
                    <span className="text-[10px] text-[#fca311]">Search {searchEngine.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Toolbar Icons (Umbra Media Sniffer, Menu) */}
          <div className="flex items-center gap-1.5">
            {/* Umbra Media Sniffer Button */}
            <button
              onClick={() => openSpecialTab('umbra://downloads', 'Downloads')}
              className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14213d] hover:bg-[#14213d]/80 text-[#ffffff] border border-[#14213d] text-xs font-medium transition-colors"
              title="Umbra Media Sniffer & Downloads"
            >
              <Download className="w-3.5 h-3.5 text-[#fca311]" />
              <span className="hidden md:inline">Media Sniffer</span>
              {activeTab.mediaFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#fca311] text-[#000000] font-bold px-1.5 py-0.2 rounded-full text-[10px] animate-pulse">
                  {activeTab.mediaFiles.length}
                </span>
              )}
            </button>

            {/* Menu Button (Hamburger) */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#e5e5e5] transition-colors"
                title="Umbra Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#14213d] border border-[#fca311]/30 rounded-2xl shadow-2xl py-2 z-50 text-xs text-[#ffffff]">
                  <div className="px-4 py-2 text-[10px] uppercase font-bold text-[#fca311] tracking-wider border-b border-[#000000]">
                    Umbra Menu
                  </div>
                  <button
                    onClick={() => { openSpecialTab('umbra://privacy-dashboard', 'Privacy Dashboard'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center gap-2.5 transition-colors font-semibold text-[#fca311]"
                  >
                    <PieChart className="w-3.5 h-3.5 text-[#fca311]" /> Privacy Dashboard
                  </button>
                  <button
                    onClick={() => { navigateTo('umbra://demo'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center gap-2.5 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#fca311]" /> Privacy Test Hub
                  </button>
                  <button
                    onClick={() => { setIsBookmarksOpen(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center gap-2.5 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#fca311]" /> Bookmarks
                  </button>
                  <button
                    onClick={() => {
                      setIsFindInPageOpen(true);
                      setIsMenuOpen(false);
                      setTimeout(() => {
                        findInputRef.current?.focus();
                        findInputRef.current?.select();
                      }, 50);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Search className="w-3.5 h-3.5 text-[#fca311]" /> Find in Page
                    </span>
                    <span className="text-[10px] text-[#e5e5e5] font-mono bg-[#000000]/60 px-1.5 py-0.5 rounded">Ctrl+F</span>
                  </button>
                  <button
                    onClick={() => { openSpecialTab('umbra://history', 'History'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center gap-2.5 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-[#fca311]" /> History Tab
                  </button>
                  <button
                    onClick={() => { openSpecialTab('umbra://downloads', 'Downloads'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center gap-2.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#fca311]" /> Downloads Tab
                  </button>
                  <div className="border-t border-[#000000] my-1" />
                  <button
                    onClick={() => { openSpecialTab('umbra://settings', 'Settings'); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#000000] flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#fca311]" /> Settings Tab
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex relative overflow-hidden bg-[#000000]">
        
        {/* Floating Find in Page Search Bar */}
        {isFindInPageOpen && (
          <div className="find-in-page-bar absolute top-3 right-5 z-40 flex items-center gap-1.5 p-1.5 bg-[#14213d] border border-[#fca311]/50 rounded-2xl shadow-2xl text-xs text-[#ffffff] backdrop-blur-md animate-in fade-in duration-150">
            <div className="flex items-center pl-2 pr-1 gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#fca311] shrink-0" />
              <input
                ref={findInputRef}
                type="text"
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                      handleFindPrev();
                    } else {
                      handleFindNext();
                    }
                  } else if (e.key === 'Escape') {
                    setIsFindInPageOpen(false);
                  }
                }}
                placeholder="Find in page..."
                className="w-36 sm:w-48 bg-[#000000] border border-[#14213d] rounded-lg px-2.5 py-1 text-xs text-[#ffffff] placeholder-[#e5e5e5]/50 focus:outline-none focus:border-[#fca311]"
                autoFocus
              />
            </div>

            {/* Match Count Indicator */}
            <div className="px-2 py-0.5 font-mono text-[11px] text-[#e5e5e5] whitespace-nowrap">
              {findQuery.trim() ? (
                matchCount > 0 ? (
                  <span>
                    <strong className="text-[#fca311]">{currentMatchIndex + 1}</strong> of {matchCount}
                  </span>
                ) : (
                  <span className="text-rose-400">0 of 0</span>
                )
              ) : (
                <span className="text-[#e5e5e5]/60">—</span>
              )}
            </div>

            {/* Prev Button */}
            <button
              onClick={handleFindPrev}
              disabled={matchCount === 0}
              className="p-1 rounded-md hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Next Button */}
            <button
              onClick={handleFindNext}
              disabled={matchCount === 0}
              className="p-1 rounded-md hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next match (Enter)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-[#000000] mx-0.5" />

            {/* Close Button */}
            <button
              onClick={() => {
                setIsFindInPageOpen(false);
                setFindQuery('');
              }}
              className="p-1 rounded-md hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
              title="Close (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Browser Viewport Area */}
        <div ref={viewportRef} className="flex-1 flex flex-col bg-[#000000] overflow-y-auto">
          <div
            className="flex-1 flex flex-col w-full h-full transition-transform duration-150 origin-top-left"
            style={{
              transform: `scale(${currentZoom / 100})`,
              width: `${100 / (currentZoom / 100)}%`,
              height: `${100 / (currentZoom / 100)}%`
            }}
          >
          {activeTab.url === 'umbra://newtab' ? (
            /* NEW TAB PAGE */
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#14213d] border border-[#fca311]/30 shadow-2xl shadow-[#fca311]/10 mb-4">
                  <Shield className="w-10 h-10 text-[#fca311]" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#ffffff]">
                  Umbra Browser
                </h1>
                <p className="text-[#e5e5e5] text-sm mt-2 max-w-md mx-auto">
                  Privacy-first browsing with automatic tracker protection and lightning-fast media acceleration.
                </p>
              </div>

              {/* Central Search / URL Input Box */}
              <div className="w-full mb-10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputUrl && inputUrl !== 'umbra://newtab') {
                      navigateTo(inputUrl);
                    }
                  }}
                  className="relative flex items-center bg-[#14213d] border border-[#fca311]/30 rounded-2xl px-4 py-3 shadow-2xl focus-within:border-[#fca311] focus-within:ring-2 focus-within:ring-[#fca311]/30 transition-all"
                >
                  <Search className="w-5 h-5 text-[#fca311] mr-3 shrink-0" />
                  <input
                    type="text"
                    value={inputUrl === 'umbra://newtab' ? '' : inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder={`Search with ${searchEngine.toUpperCase()} or enter a URL...`}
                    className="w-full bg-transparent text-sm text-[#ffffff] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs transition-colors shrink-0 shadow-md shadow-[#fca311]/20"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab.url === 'umbra://settings' ? (
            /* FULL TAB SETTINGS WITH SPRING ANIMATION */
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto bg-[#000000]"
            >
              <div className="flex items-center justify-between pb-6 border-b border-[#14213d] mb-6">
                <h1 className="text-2xl font-bold text-[#ffffff]">Umbra Browser Settings</h1>
                <button
                  onClick={() => openSpecialTab('umbra://newtab', 'New Tab')}
                  className="px-4 py-2 bg-[#14213d] text-[#fca311] rounded-xl text-xs font-semibold hover:bg-[#14213d]/80 transition-colors"
                >
                  Close Settings
                </button>
              </div>

              <div className="bg-[#14213d] border border-[#14213d] rounded-3xl p-6 space-y-6">
                <div className="flex gap-2 border-b border-[#000000] pb-4 overflow-x-auto">
                  {[
                    { id: 'general', label: 'General' },
                    { id: 'theme', label: 'Theme' },
                    { id: 'search', label: 'Search Engine' },
                    { id: 'privacy', label: 'Privacy & Shields' },
                    { id: 'extensions', label: 'Extensions' },
                    { id: 'sync', label: 'Device Sync' },
                    { id: 'profiles', label: 'Profiles' },
                    { id: 'passwords', label: 'Passwords' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        settingsTab === tab.id ? 'bg-[#fca311] text-[#000000]' : 'bg-[#000000] text-[#e5e5e5] hover:bg-[#000000]/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {settingsTab === 'general' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white text-sm">Theme & Appearance</h4>
                        <p className="text-xs text-[#e5e5e5]">Toggle between Dark, Light, and System modes</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#000000] p-1 rounded-xl border border-[#14213d]">
                        {(['dark', 'light', 'system'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setThemeMode(mode)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                              themeMode === mode
                                ? 'bg-[#fca311] text-[#000000] shadow'
                                : 'text-[#e5e5e5] hover:text-[#ffffff]'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#000000]">
                      <div>
                        <h4 className="font-semibold text-white text-sm">Memory Saver</h4>
                        <p className="text-xs text-[#e5e5e5]">Automatically puts background tabs into a hibernated state to free up system RAM</p>
                      </div>
                      <button
                        onClick={() => setMemorySaverEnabled(!memorySaverEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          memorySaverEnabled ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#000000]">
                      <div>
                        <h4 className="font-semibold text-white text-sm">Battery Saver</h4>
                        <p className="text-xs text-[#e5e5e5]">Reduces frequency of background tab updates and dims non-critical animations to save laptop battery</p>
                      </div>
                      <button
                        onClick={() => setBatterySaverEnabled(!batterySaverEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          batterySaverEnabled ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#000000]">
                      <div>
                        <h4 className="font-semibold text-white text-sm">Clear Browsing Data & Cache</h4>
                        <p className="text-xs text-[#e5e5e5]">Delete browsing history, cached files, and cookies instantly</p>
                      </div>
                      <button
                        onClick={clearBrowsingData}
                        className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                      >
                        Clear Data
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#000000]">
                      <div>
                        <h4 className="font-semibold text-white text-sm">Auto-Enable Reading Mode on News Sites</h4>
                        <p className="text-xs text-[#e5e5e5]">Automatically strip away sidebars and ads when visiting news articles</p>
                      </div>
                      <button
                        onClick={() => setAutoReadingModeNews(!autoReadingModeNews)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                          autoReadingModeNews ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                      </button>
                    </div>
                  </div>
                )}

                {settingsTab === 'theme' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-bold text-white text-base mb-1">Theme & Appearance</h3>
                      <p className="text-xs text-[#e5e5e5]">Choose how Umbra looks to you. Select between Dark, Light, or System-synchronized modes.</p>
                    </div>

                    {/* 3 Theme Mode Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Dark Theme Card */}
                      <div
                        onClick={() => setThemeMode('dark')}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                          themeMode === 'dark'
                            ? 'bg-[#000000] border-[#fca311] shadow-lg ring-1 ring-[#fca311]'
                            : 'bg-[#000000]/60 border-[#14213d] hover:bg-[#000000]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 rounded-xl bg-[#14213d] text-[#fca311]">
                              <Moon className="w-5 h-5" />
                            </div>
                            {themeMode === 'dark' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">
                                Active
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-sm">Dark Mode</h4>
                          <p className="text-[11px] text-[#e5e5e5] mt-1 leading-snug">
                            Deep black and navy contrast (#000000, #14213d) with signature amber accents (#fca311).
                          </p>
                        </div>

                        {/* Visual Swatch */}
                        <div className="mt-4 pt-3 border-t border-[#14213d] flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-[#000000] border border-white/20" title="#000000" />
                          <div className="w-5 h-5 rounded-md bg-[#14213d]" title="#14213d" />
                          <div className="w-5 h-5 rounded-md bg-[#fca311]" title="#fca311" />
                          <div className="w-5 h-5 rounded-md bg-[#e5e5e5]" title="#e5e5e5" />
                          <div className="w-5 h-5 rounded-md bg-[#ffffff]" title="#ffffff" />
                        </div>
                      </div>

                      {/* Light Theme Card */}
                      <div
                        onClick={() => setThemeMode('light')}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                          themeMode === 'light'
                            ? 'bg-[#000000] border-[#fca311] shadow-lg ring-1 ring-[#fca311]'
                            : 'bg-[#000000]/60 border-[#14213d] hover:bg-[#000000]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 rounded-xl bg-[#14213d] text-[#fca311]">
                              <Sun className="w-5 h-5" />
                            </div>
                            {themeMode === 'light' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">
                                Active
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-sm">Light Mode</h4>
                          <p className="text-[11px] text-[#e5e5e5] mt-1 leading-snug">
                            Crisp white and soft silver palette (#ffffff, #e5e5e5) with high-contrast text and amber highlights.
                          </p>
                        </div>

                        {/* Visual Swatch */}
                        <div className="mt-4 pt-3 border-t border-[#14213d] flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-[#ffffff] border border-black/20" title="#ffffff" />
                          <div className="w-5 h-5 rounded-md bg-[#e5e5e5]" title="#e5e5e5" />
                          <div className="w-5 h-5 rounded-md bg-[#fca311]" title="#fca311" />
                          <div className="w-5 h-5 rounded-md bg-[#14213d]" title="#14213d" />
                          <div className="w-5 h-5 rounded-md bg-[#000000]" title="#000000" />
                        </div>
                      </div>

                      {/* System Theme Card */}
                      <div
                        onClick={() => setThemeMode('system')}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                          themeMode === 'system'
                            ? 'bg-[#000000] border-[#fca311] shadow-lg ring-1 ring-[#fca311]'
                            : 'bg-[#000000]/60 border-[#14213d] hover:bg-[#000000]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 rounded-xl bg-[#14213d] text-[#fca311]">
                              <Monitor className="w-5 h-5" />
                            </div>
                            {themeMode === 'system' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">
                                Active
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-sm">System Mode</h4>
                          <p className="text-[11px] text-[#e5e5e5] mt-1 leading-snug">
                            Syncs automatically with your operating system preference (Currently: {systemPrefersDark ? 'Dark' : 'Light'}).
                          </p>
                        </div>

                        {/* Visual Swatch: Split */}
                        <div className="mt-4 pt-3 border-t border-[#14213d] flex items-center justify-between text-[10px] text-[#e5e5e5]">
                          <span>Auto-Switching</span>
                          <span className="font-mono text-[#fca311]">prefers-color-scheme</span>
                        </div>
                      </div>
                    </div>

                    {/* Color Palette Display */}
                    <div className="p-4 bg-[#000000] rounded-2xl border border-[#14213d]">
                      <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#fca311]" /> Umbra Official CSS Palette
                      </h4>
                      <p className="text-[11px] text-[#e5e5e5] mb-3">
                        Active CSS color palette applied across the browser interface.
                      </p>
                      <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                        <div className="p-2 rounded-xl bg-[#000000] border border-white/20">
                          <div className="w-4 h-4 rounded-full bg-[#000000] mx-auto border border-white mb-1" />
                          <span className="font-mono text-white">#000000</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#14213d] border border-white/20">
                          <div className="w-4 h-4 rounded-full bg-[#14213d] mx-auto border border-white mb-1" />
                          <span className="font-mono text-white">#14213d</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#fca311]">
                          <div className="w-4 h-4 rounded-full bg-[#fca311] mx-auto mb-1" />
                          <span className="font-mono text-black font-bold">#fca311</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#e5e5e5]">
                          <div className="w-4 h-4 rounded-full bg-[#e5e5e5] mx-auto border border-black mb-1" />
                          <span className="font-mono text-black font-bold">#e5e5e5</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#ffffff]">
                          <div className="w-4 h-4 rounded-full bg-[#ffffff] mx-auto border border-black mb-1" />
                          <span className="font-mono text-black font-bold">#ffffff</span>
                        </div>
                      </div>
                    </div>

                    {/* Reading Mode Theme Selector */}
                    <div className="p-5 bg-[#000000] rounded-2xl border border-[#14213d] mt-6">
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#fca311]" /> Reading Mode Theme
                        </h4>
                        <p className="text-xs text-[#e5e5e5] mt-1">
                          Select your background and typography canvas color scheme when distraction-free Reading Mode is enabled on news sites or articles.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Light Reading Theme Card */}
                        <div
                          onClick={() => setReadingModeTheme('light')}
                          className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                            readingModeTheme === 'light'
                              ? 'bg-[#ffffff] text-[#14213d] border-[#fca311] ring-2 ring-[#fca311] shadow-lg'
                              : 'bg-[#14213d]/60 text-white border-[#14213d] hover:bg-[#14213d]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-2 rounded-lg bg-[#e2e8f0] text-[#14213d]">
                                <Sun className="w-4 h-4" />
                              </div>
                              {readingModeTheme === 'light' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">
                                  Active
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs">Light Canvas</h5>
                            <p className="text-[11px] opacity-80 mt-1">Crisp off-white background (#f8f9fa) with slate typography for daylight reading.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-black/10 flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-[#ffffff] border border-gray-300" title="#ffffff" />
                            <div className="w-4 h-4 rounded bg-[#14213d]" title="#14213d" />
                          </div>
                        </div>

                        {/* Sepia Reading Theme Card */}
                        <div
                          onClick={() => setReadingModeTheme('sepia')}
                          className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                            readingModeTheme === 'sepia'
                              ? 'bg-[#fbf0d9] text-[#433422] border-[#fca311] ring-2 ring-[#fca311] shadow-lg'
                              : 'bg-[#14213d]/60 text-white border-[#14213d] hover:bg-[#14213d]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-2 rounded-lg bg-[#f0e2c2] text-[#433422]">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              {readingModeTheme === 'sepia' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">
                                  Active
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs">Sepia Warmth</h5>
                            <p className="text-[11px] opacity-80 mt-1">Warm paper tint (#fbf0d9) with warm brown text for reduced eye strain.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-black/10 flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-[#fbf0d9] border border-amber-300" title="#fbf0d9" />
                            <div className="w-4 h-4 rounded bg-[#433422]" title="#433422" />
                          </div>
                        </div>

                        {/* Dark Reading Theme Card */}
                        <div
                          onClick={() => setReadingModeTheme('dark')}
                          className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col justify-between ${
                            readingModeTheme === 'dark'
                              ? 'bg-[#000000] text-white border-[#fca311] ring-2 ring-[#fca311] shadow-lg'
                              : 'bg-[#14213d]/60 text-white border-[#14213d] hover:bg-[#14213d]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-2 rounded-lg bg-[#14213d] text-[#fca311]">
                                <Moon className="w-4 h-4" />
                              </div>
                              {readingModeTheme === 'dark' && (
                                <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">
                                  Active
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs font-semibold">Dark Stealth</h5>
                            <p className="text-[11px] opacity-80 mt-1">Deep obsidian background (#000000) with amber accents for nighttime reading.</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-[#000000] border border-white/30" title="#000000" />
                            <div className="w-4 h-4 rounded bg-[#fca311]" title="#fca311" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'search' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-[#e5e5e5] uppercase tracking-wider mb-2">Select Default Search Engine</h4>
                    {[
                      { id: 'google', name: 'Google', desc: 'Default search engine (google.com)' },
                      { id: 'duckduckgo', name: 'DuckDuckGo', desc: 'Privacy-focused search engine (duckduckgo.com)' },
                      { id: 'bing', name: 'Bing', desc: 'Microsoft search engine (bing.com)' },
                      { id: 'brave', name: 'Brave Search', desc: 'Independent privacy search (search.brave.com)' },
                      { id: 'yahoo', name: 'Yahoo', desc: 'Yahoo search (search.yahoo.com)' },
                    ].map((engine) => (
                      <div
                        key={engine.id}
                        onClick={() => setSearchEngine(engine.id as any)}
                        className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer text-xs border transition-all ${
                          searchEngine === engine.id
                            ? 'bg-[#000000] border-[#fca311] text-white shadow-md'
                            : 'bg-[#000000]/60 border-[#14213d] text-[#e5e5e5] hover:bg-[#000000]'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white text-sm">{engine.name}</div>
                          <div className="text-[10px] text-[#e5e5e5] mt-0.5">{engine.desc}</div>
                        </div>
                        {searchEngine === engine.id && (
                          <span className="px-2.5 py-1 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px]">Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {settingsTab === 'privacy' && (
                  <div className="space-y-5">
                    {[
                      { key: 'blockAds', title: 'Block Intrusive Ads', desc: 'Automatically block pop-ups, video ads, and banners' },
                      { key: 'blockTrackers', title: 'Block Cross-Site Trackers', desc: 'Prevent trackers from following your browsing habits across sites' },
                      { key: 'blockCookies', title: 'Cookie Notice Stopper', desc: 'Automatically reject cookie consent banners' },
                      { key: 'httpsOnly', title: 'HTTPS Everywhere', desc: 'Automatically upgrade insecure HTTP requests to secure HTTPS' },
                      { key: 'fingerprintProtection', title: 'Anti-Fingerprinting Defense', desc: 'Randomize browser fingerprinting signatures' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                          <p className="text-xs text-[#e5e5e5]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, [item.key]: !((prev as any)[item.key]) }))}
                          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                            (settings as any)[item.key] ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {settingsTab === 'extensions' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-[#000000]">
                      <div>
                        <h4 className="font-bold text-white text-sm">Chromium Extension Manager</h4>
                        <p className="text-xs text-[#e5e5e5]">Umbra is built on Chromium and supports standard .zip/.crx extensions</p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customExtName}
                          onChange={(e) => setCustomExtName(e.target.value)}
                          placeholder="Extension name..."
                          className="bg-[#000000] border border-[#14213d] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fca311]"
                        />
                        <button
                          onClick={() => {
                            if (customExtName.trim()) {
                              setExtensions(prev => [...prev, {
                                id: 'ext_' + Date.now(),
                                name: customExtName.trim(),
                                version: '1.0.0',
                                description: 'User installed Chromium extension.',
                                enabled: true,
                                author: 'Local User'
                              }]);
                              setCustomExtName('');
                            }
                          }}
                          className="px-3 py-1.5 bg-[#fca311] text-[#000000] font-bold rounded-xl text-xs hover:bg-[#fca311]/90 transition-colors flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" /> Install
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {extensions.map(ext => (
                        <div key={ext.id} className="flex items-center justify-between p-4 bg-[#000000] rounded-2xl border border-[#14213d]">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white text-sm">{ext.name}</h4>
                              <span className="text-[10px] bg-[#14213d] px-2 py-0.5 rounded text-[#fca311]">v{ext.version}</span>
                            </div>
                            <p className="text-xs text-[#e5e5e5] mt-1">{ext.description} <span className="text-[10px] text-slate-500">by {ext.author}</span></p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setExtensions(prev => prev.map(e => e.id === ext.id ? { ...e, enabled: !e.enabled } : e))}
                              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                                ext.enabled ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                              }`}
                            >
                              <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                            </button>
                            <button
                              onClick={() => setExtensions(prev => prev.filter(e => e.id !== ext.id))}
                              className="p-1.5 rounded-lg hover:bg-rose-600/20 text-rose-400 transition-colors"
                              title="Remove Extension"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'sync' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#000000] rounded-2xl border border-[#14213d]">
                      <div>
                        <h4 className="font-semibold text-white text-sm">Umbra Device Sync</h4>
                        <p className="text-xs text-[#e5e5e5]">Sync tabs, bookmarks, and passwords securely across all your devices</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleManualCloudSync}
                          className="px-4 py-2 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md"
                        >
                          <Cloud className="w-3.5 h-3.5" /> Sync Now
                        </button>
                        <button
                          onClick={() => setDeviceSyncEnabled(!deviceSyncEnabled)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                            deviceSyncEnabled ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-[#fca311] font-mono px-1">Status: {syncStatus}</div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#e5e5e5] uppercase tracking-wider mb-3">Connected Devices</h4>
                      <div className="space-y-2">
                        {syncedDevices.map(dev => (
                          <div key={dev.id} className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d] text-xs">
                            <div className="flex items-center gap-3">
                              <Laptop className="w-4 h-4 text-[#fca311]" />
                              <div>
                                <div className="font-medium text-white">{dev.name}</div>
                                <div className="text-[10px] text-[#e5e5e5]">Last synced: {dev.lastSync}</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-[#14213d] text-[#fca311] text-[10px]">Synced</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'passwords' && (
                  <div className="space-y-6">
                    {isPasswordVaultLocked ? (
                      <div className="bg-[#000000] border border-[#14213d] rounded-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-[#14213d] text-[#fca311] rounded-2xl mx-auto flex items-center justify-center border border-[#fca311]/30">
                          <Lock className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Password Vault is Locked</h4>
                          <p className="text-xs text-[#e5e5e5] mt-1">Enter master password to access saved logins and form autofill.</p>
                        </div>
                        <div className="flex max-w-xs mx-auto gap-2">
                          <input
                            type="password"
                            value={masterPasswordInput}
                            onChange={(e) => setMasterPasswordInput(e.target.value)}
                            placeholder="Master password (any)..."
                            className="flex-1 bg-[#14213d] border border-[#14213d] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fca311]"
                          />
                          <button
                            onClick={() => {
                              if (masterPasswordInput.trim()) {
                                setIsPasswordVaultLocked(false);
                                setMasterPasswordInput('');
                              }
                            }}
                            className="px-4 py-2 bg-[#fca311] text-[#000000] font-bold rounded-xl text-xs hover:bg-[#fca311]/90 transition-colors"
                          >
                            Unlock
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[#000000] rounded-2xl border border-[#14213d]">
                          <div>
                            <h4 className="font-semibold text-white text-sm">Form Autofill & CSV Import</h4>
                            <p className="text-xs text-[#e5e5e5]">Import passwords from a CSV file or download the template</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={downloadPasswordTemplate}
                              className="px-3 py-1.5 bg-[#14213d] text-[#fca311] border border-[#fca311]/30 rounded-xl text-xs font-semibold hover:bg-[#14213d]/80 transition-colors flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" /> Template CSV
                            </button>
                            <label className="px-3 py-1.5 bg-[#fca311] text-[#000000] font-bold rounded-xl text-xs hover:bg-[#fca311]/90 transition-colors cursor-pointer flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" /> Import CSV
                              <input type="file" accept=".csv" onChange={handlePasswordCsvImport} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-[#e5e5e5] uppercase tracking-wider mb-3">Saved Passwords ({passwords.length})</h4>
                          <div className="space-y-2 mb-4">
                            {passwords.map(pwd => (
                              <div key={pwd.id} className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d] text-xs">
                                <div>
                                  <div className="font-semibold text-white">{pwd.site}</div>
                                  <div className="text-[10px] text-[#e5e5e5]">{pwd.username} • {pwd.pass}</div>
                                </div>
                                <button
                                  onClick={() => setPasswords(prev => prev.filter(p => p.id !== pwd.id))}
                                  className="p-1.5 rounded-lg hover:bg-rose-600/20 text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab.url === 'umbra://privacy-dashboard' ? (
            /* PRIVACY DASHBOARD */
            <div className="flex-1 p-8 max-w-5xl mx-auto w-full overflow-y-auto bg-[#000000]">
              <div className="flex items-center justify-between pb-6 border-b border-[#14213d] mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#14213d] text-[#fca311] border border-[#fca311]/30 font-semibold uppercase tracking-wider">
                      Executive Security Summary
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-[#ffffff]">Umbra Privacy Dashboard</h1>
                  <p className="text-sm text-[#e5e5e5] mt-1">Real-time aggregate summary of intercepted network trackers, bandwidth saved, and estimated load time saved.</p>
                </div>
                <button
                  onClick={handleManualCloudSync}
                  className="px-4 py-2.5 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs shadow-lg transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Sync Cloud Profile
                </button>
              </div>

              {/* 3 KPI Summary Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Total Blocked Trackers */}
                <div className="bg-[#14213d] border border-[#fca311]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#fca311]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-[#fca311] uppercase tracking-wider">Blocked Trackers</span>
                    <div className="p-2.5 bg-[#000000] text-[#fca311] rounded-2xl border border-[#fca311]/20">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold text-[#ffffff] font-mono tracking-tight">{totalBlocked}</div>
                  <p className="text-xs text-[#e5e5e5] mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#fca311]" /> Ads & tracking scripts stopped
                  </p>
                </div>

                {/* Card 2: Total Bandwidth Saved */}
                <div className="bg-[#14213d] border border-[#fca311]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#fca311]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-[#fca311] uppercase tracking-wider">Bandwidth Saved</span>
                    <div className="p-2.5 bg-[#000000] text-[#fca311] rounded-2xl border border-[#fca311]/20">
                      <Zap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold text-[#ffffff] font-mono tracking-tight">{bandwidthSaved}</div>
                  <p className="text-xs text-[#e5e5e5] mt-2 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-[#fca311]" /> Cellular data & network overhead saved
                  </p>
                </div>

                {/* Card 3: Total Time Saved */}
                <div className="bg-[#14213d] border border-[#fca311]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#fca311]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-[#fca311] uppercase tracking-wider">Time Saved</span>
                    <div className="p-2.5 bg-[#000000] text-[#fca311] rounded-2xl border border-[#fca311]/20">
                      <Cpu className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-4xl font-extrabold text-[#ffffff] font-mono tracking-tight">{timeSaved}</div>
                  <p className="text-xs text-[#e5e5e5] mt-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#fca311]" /> Faster render speeds across all tabs
                  </p>
                </div>
              </div>

              {/* 7-Day Chart & Active Protections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-[#14213d] border border-[#14213d] rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-[#ffffff] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#fca311]" /> 7-Day Network Interception Visualizer
                    </h3>
                    <span className="text-[11px] font-mono text-[#fca311] bg-[#000000] px-2 py-0.5 rounded-lg border border-[#fca311]/20">D3.js Powered</span>
                  </div>
                  <p className="text-xs text-[#e5e5e5] mb-4">Daily total count of trackers, cross-site cookies, and telemetry requests intercepted by Umbra Shields.</p>
                  <BlockersChart />
                </div>

                <div className="bg-[#14213d] border border-[#14213d] rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[#ffffff] mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#fca311]" /> Active Engine Protections
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d]">
                        <span className="text-[#ffffff]">Ad Network Blocker</span>
                        <span className="text-[#fca311] font-bold text-[11px]">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d]">
                        <span className="text-[#ffffff]">Tracker & Pixel Defense</span>
                        <span className="text-[#fca311] font-bold text-[11px]">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d]">
                        <span className="text-[#ffffff]">Fingerprint Protection</span>
                        <span className="text-[#fca311] font-bold text-[11px]">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d]">
                        <span className="text-[#ffffff]">Media Sniffer Isolation</span>
                        <span className="text-[#fca311] font-bold text-[11px]">ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#000000] mt-4 flex items-center justify-between text-xs">
                    <span className="text-[#e5e5e5]">Sync Status:</span>
                    <span className="text-[#fca311] font-mono">{syncStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab.url === 'umbra://downloads' ? (
            /* FULL TAB DOWNLOADS */
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto bg-[#000000]">
              <div className="flex items-center justify-between pb-6 border-b border-[#14213d] mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-[#ffffff]">Umbra Media Sniffer & Downloads</h1>
                  <p className="text-sm text-[#e5e5e5]">High-speed multi-threaded media acceleration and grabbed streams</p>
                </div>
                <button
                  onClick={() => openSpecialTab('umbra://newtab', 'New Tab')}
                  className="px-4 py-2 bg-[#14213d] text-[#fca311] rounded-xl text-xs font-semibold hover:bg-[#14213d]/80 transition-colors"
                >
                  Close Downloads
                </button>
              </div>

              <div className="space-y-3">
                {downloads.length === 0 ? (
                  <div className="text-center py-12 text-[#e5e5e5] text-sm">No active downloads</div>
                ) : (
                  downloads.map((dl) => (
                    <div key={dl.id} className="bg-[#14213d] border border-[#14213d] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-[#ffffff] text-xs truncate max-w-sm">{dl.name}</div>
                        <div className="text-xs text-[#fca311] font-mono">{dl.speed || dl.status}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#000000] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#fca311] h-full transition-all duration-300"
                            style={{ width: `${dl.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#e5e5e5] font-mono w-10 text-right">{dl.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-[#e5e5e5]">
                        <span>Size: {dl.size}</span>
                        <span>{dl.status === 'completed' ? 'Download Complete' : 'Downloading with 8 threads...'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab.url === 'umbra://history' ? (
            /* FULL TAB HISTORY */
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto bg-[#000000]">
              <div className="flex items-center justify-between pb-6 border-b border-[#14213d] mb-8">
                <h1 className="text-2xl font-bold text-[#ffffff]">Browsing History</h1>
                <button
                  onClick={clearBrowsingData}
                  className="px-4 py-2 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold hover:bg-rose-600 hover:text-white transition-all"
                >
                  Clear History
                </button>
              </div>

              <div className="space-y-2">
                {activeTab.history.map((h, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateTo(h)}
                    className="flex items-center justify-between p-4 bg-[#14213d] hover:bg-[#14213d]/80 rounded-2xl cursor-pointer text-xs border border-[#14213d]"
                  >
                    <span className="font-mono text-[#fca311] truncate max-w-[450px]">{h}</span>
                    <span className="text-[#e5e5e5] text-[10px]">Visited recently</span>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab.url === 'umbra://demo' ? (
            /* PRIVACY TEST HUB WITH D3.JS CHART */
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto bg-[#000000]">
              <div className="flex items-center justify-between pb-6 border-b border-[#14213d] mb-8">
                <div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#14213d] text-[#fca311] border border-[#fca311]/30 font-medium">
                    Privacy Test Hub
                  </span>
                  <h1 className="text-2xl font-bold text-[#ffffff] mt-2">Umbra Privacy & Blockers Analytics</h1>
                  <p className="text-sm text-[#e5e5e5]">Trackers and ads blocked over the last 7 days (Powered by D3.js).</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#fca311]">Shields ACTIVE</div>
                    <div className="text-xs text-[#e5e5e5]">{activeTab.blockedCount} items intercepted</div>
                  </div>
                  <button
                    onClick={toggleShields}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab.shieldsUp ? 'bg-[#fca311] text-[#000000]' : 'bg-rose-600 text-[#ffffff]'
                    }`}
                  >
                    {activeTab.shieldsUp ? 'Shields UP' : 'Shields DOWN'}
                  </button>
                </div>
              </div>

              {/* D3.js Chart Card */}
              <div className="bg-[#14213d] border border-[#14213d] rounded-3xl p-6 mb-8">
                <h3 className="text-sm font-semibold text-[#ffffff] mb-2">Weekly Trackers & Ads Blocked</h3>
                <p className="text-xs text-[#e5e5e5] mb-4">Interactive D3 bar chart representation of daily blocked network requests.</p>
                <BlockersChart />
              </div>

              <div className="space-y-6">
                <div className="bg-[#14213d] border border-[#14213d] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-[#ffffff] mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#fca311]" /> Automatically Blocked Tracking Scripts & Ads
                  </h3>
                  <div className="space-y-3">
                    {[
                      { domain: 'google-analytics.com/analytics.js', type: 'Analytics Tracker', status: activeTab.shieldsUp ? 'Blocked' : 'Allowed' },
                      { domain: 'connect.facebook.net/en_US/fbevents.js', type: 'Social Pixel Tracker', status: activeTab.shieldsUp ? 'Blocked' : 'Allowed' },
                      { domain: 'adservice.google.com/ads/aclk', type: 'Intrusive Ad Banner', status: activeTab.shieldsUp ? 'Blocked' : 'Allowed' },
                      { domain: 'hotjar.com/c/hotjar-script.js', type: 'Session Replay Tracker', status: activeTab.shieldsUp ? 'Blocked' : 'Allowed' },
                    ].map((tracker, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#000000] rounded-xl border border-[#14213d] text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${activeTab.shieldsUp && tracker.status === 'Blocked' ? 'bg-[#fca311]' : 'bg-rose-500'}`} />
                          <div>
                            <div className="font-mono text-[#ffffff]">{tracker.domain}</div>
                            <div className="text-[#e5e5e5] text-[10px]">{tracker.type}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                          activeTab.shieldsUp ? 'bg-[#14213d] text-[#fca311]' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {activeTab.shieldsUp ? 'Blocked' : 'Passed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab.url === 'umbra://media-demo' ? (
            /* UMBRA MEDIA SNIFFER DEMO PAGE */
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full overflow-y-auto bg-[#000000]">
              <div className="flex items-center justify-between pb-6 border-b border-[#14213d] mb-8">
                <div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#14213d] text-[#fca311] border border-[#fca311]/30 font-medium">
                    Umbra Media Sniffer Demonstration
                  </span>
                  <h1 className="text-2xl font-bold text-[#ffffff] mt-2">Detected Media Streams & Files</h1>
                  <p className="text-sm text-[#e5e5e5]">Umbra Media Sniffer automatically sniffs embedded videos, audio tracks, and documents for high-speed multi-threaded downloads.</p>
                </div>
                <button
                  onClick={() => openSpecialTab('umbra://downloads', 'Downloads')}
                  className="px-4 py-2 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#fca311]/20 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Open Media Grabber ({activeTab.mediaFiles.length})
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {activeTab.mediaFiles.map((media) => (
                  <div key={media.id} className="bg-[#14213d] border border-[#14213d] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-[#000000] text-[#fca311] rounded-2xl">
                        {media.type === 'video' ? <Film className="w-6 h-6" /> : media.type === 'audio' ? <Music className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#ffffff] text-sm">{media.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-[#e5e5e5] mt-1">
                          <span>Size: <strong className="text-[#ffffff]">{media.size}</strong></span>
                          <span>Format: <strong className="text-[#ffffff] uppercase">{media.type}</strong></span>
                          {media.resolution && <span>Quality: <strong className="text-[#fca311]">{media.resolution}</strong></span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => startDownload(media)}
                        className="px-4 py-2 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-[#fca311]/20"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab.isReadingMode ? (
            /* READING MODE VIEW WITH DYNAMIC THEME */
            <div className={`flex-1 p-12 max-w-3xl mx-auto w-full overflow-y-auto font-serif leading-relaxed transition-colors duration-200 ${
              readingModeTheme === 'sepia'
                ? 'bg-[#fbf0d9] text-[#433422]'
                : readingModeTheme === 'light'
                  ? 'bg-[#f8f9fa] text-[#14213d]'
                  : 'bg-[#000000] text-[#e5e5e5]'
            }`}>
              <div className={`flex items-center justify-between pb-6 border-b mb-8 font-sans ${
                readingModeTheme === 'sepia'
                  ? 'border-[#e2d4b8]'
                  : readingModeTheme === 'light'
                    ? 'border-[#cbd5e1]'
                    : 'border-[#14213d]'
              }`}>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  readingModeTheme === 'sepia'
                    ? 'bg-[#f0e2c2] text-[#433422] border border-[#433422]/20'
                    : readingModeTheme === 'light'
                      ? 'bg-[#e2e8f0] text-[#14213d] border border-[#14213d]/20'
                      : 'bg-[#14213d] text-[#fca311] border border-[#fca311]/30'
                }`}>
                  <BookOpen className="w-3.5 h-3.5" />
                  Umbra Reading Mode ({readingModeTheme})
                </span>
                <button
                  onClick={toggleReadingMode}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-colors ${
                    readingModeTheme === 'sepia'
                      ? 'bg-[#f0e2c2] text-[#433422] hover:bg-[#e6d6b2]'
                      : readingModeTheme === 'light'
                        ? 'bg-[#e2e8f0] text-[#14213d] hover:bg-[#cbd5e1]'
                        : 'bg-[#14213d] text-[#fca311] hover:bg-[#14213d]/80'
                  }`}
                >
                  Exit Reading Mode
                </button>
              </div>

              <h1 className={`text-3xl font-bold font-sans mb-4 ${
                readingModeTheme === 'sepia' ? 'text-[#2c1d11]' : readingModeTheme === 'light' ? 'text-[#0f172a]' : 'text-[#ffffff]'
              }`}>
                {activeTab.customTitle || activeTab.title}
              </h1>
              <p className={`text-sm font-mono mb-8 ${
                readingModeTheme === 'sepia' ? 'text-[#8c6b43]' : readingModeTheme === 'light' ? 'text-[#64748b]' : 'text-[#fca311]'
              }`}>
                {activeTab.url}
              </p>

              <div className="space-y-6 text-base">
                <p>
                  Welcome to Umbra Reading Mode. All intrusive ad networks, social tracking scripts, promotional banners, and distracting sidebars have been automatically stripped away to give you a pristine, lightning-fast reading experience.
                </p>
                <p>
                  Content privacy is maintained by default. You can return to the original webpage view at any time by clicking the Reading Mode book icon in the address bar or customize canvas themes in Settings.
                </p>
                <h3 className={`text-xl font-bold font-sans pt-4 ${
                  readingModeTheme === 'sepia' ? 'text-[#2c1d11]' : readingModeTheme === 'light' ? 'text-[#0f172a]' : 'text-[#ffffff]'
                }`}>
                  Key Highlights & Insights
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Zero tracking pixels or telemetry loaded.</li>
                  <li>Optimized typography for effortless reading speed.</li>
                  <li>Automatic multi-threaded media acceleration ready via Umbra Media Sniffer.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* LIVE PROXY BROWSER IFRAME / VIEWER */
            <div className="flex-1 flex flex-col relative w-full h-full bg-[#ffffff]">
              <iframe
                src={`/api/proxy?url=${encodeURIComponent(activeTab.url)}`}
                className="w-full h-full border-0"
                title={activeTab.title}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          )}
          </div>
        </div>

        {/* UMBRA AI ASSISTANT SIDEBAR WITH SPRING ANIMATIONS */}
        <AnimatePresence>
          {isAiOpen && (
            <motion.div
              initial={{ opacity: 0, x: 120, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="w-96 bg-[#14213d] border-l border-[#14213d] flex flex-col shadow-2xl z-20"
            >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#000000] bg-[#000000]">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#14213d] text-[#fca311] rounded-xl border border-[#fca311]/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#ffffff]">Umbra AI Assistant</h3>
                  <p className="text-[10px] text-[#fca311]">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#14213d] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#14213d]">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="w-7 h-7 rounded-full bg-[#000000] text-[#fca311] flex items-center justify-center shrink-0 border border-[#fca311]/30 text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#fca311] text-[#000000] font-medium rounded-br-none'
                        : 'bg-[#000000] text-[#ffffff] border border-[#14213d] rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex gap-3 items-center text-xs text-[#fca311]">
                  <div className="w-7 h-7 rounded-full bg-[#000000] flex items-center justify-center animate-spin">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>Umbra AI is thinking...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendAi} className="p-3 border-t border-[#000000] bg-[#000000] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Umbra AI about this page or privacy..."
                className="flex-1 bg-[#14213d] border border-[#14213d] rounded-xl px-3 py-2 text-xs text-[#ffffff] focus:outline-none focus:border-[#fca311]"
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="px-4 py-2 bg-[#fca311] hover:bg-[#fca311]/95 disabled:opacity-50 text-[#000000] font-bold rounded-xl text-xs transition-colors"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* SEARCH TABS MODAL (Ctrl+Shift+A) */}
      {isTabSearchOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4">
          <div className="bg-[#14213d] border border-[#fca311]/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#000000]">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#fca311]" />
                <h3 className="font-bold text-base text-[#ffffff]">Search Open Tabs (Ctrl+Shift+A)</h3>
              </div>
              <button onClick={() => setIsTabSearchOpen(false)} className="p-2 rounded-xl hover:bg-[#000000] text-[#e5e5e5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4">
              <input
                type="text"
                value={tabSearchQuery}
                onChange={(e) => setTabSearchQuery(e.target.value)}
                placeholder="Type to search tabs by title or URL..."
                className="w-full bg-[#000000] border border-[#14213d] rounded-xl px-4 py-2.5 text-xs text-[#ffffff] focus:outline-none focus:border-[#fca311]"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-80">
              {tabs
                .filter(t => (t.customTitle || t.title).toLowerCase().includes(tabSearchQuery.toLowerCase()) || t.url.toLowerCase().includes(tabSearchQuery.toLowerCase()))
                .map(tab => {
                  const displayTitle = tab.customTitle || tab.title || 'New Tab';
                  return (
                    <div
                      key={tab.id}
                      onClick={() => {
                        setActiveTabId(tab.id);
                        setIsTabSearchOpen(false);
                        setTabSearchQuery('');
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs border transition-all ${
                        tab.id === activeTabId ? 'bg-[#000000] border-[#fca311] text-white' : 'bg-[#000000]/50 border-[#14213d] text-[#e5e5e5] hover:bg-[#000000]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Globe className="w-4 h-4 text-[#fca311] shrink-0" />
                        <div className="truncate">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            <span>{displayTitle}</span>
                            {tab.customTitle && (
                              <span className="text-[10px] text-[#fca311] font-normal flex items-center gap-0.5">
                                <Edit3 className="w-2.5 h-2.5" /> (Renamed)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#e5e5e5] font-mono truncate">{tab.url}</div>
                        </div>
                      </div>
                      {tab.id === activeTabId && (
                        <span className="px-2 py-0.5 rounded-full bg-[#fca311] text-[#000000] font-bold text-[10px] shrink-0">Active</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SHIELDS MODAL */}
      {isShieldsModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14213d] border border-[#14213d] rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#000000]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#000000] text-[#fca311] rounded-2xl border border-[#fca311]/30">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#ffffff]">Umbra Shields</h3>
                  <p className="text-xs text-[#e5e5e5]">{activeTab.customTitle || activeTab.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsShieldsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#000000] rounded-2xl border border-[#14213d]">
                <div>
                  <h4 className="font-semibold text-[#ffffff] text-sm">Shields for this site</h4>
                  <p className="text-xs text-[#e5e5e5]">Block ads, trackers, and malicious scripts</p>
                </div>
                <button
                  onClick={toggleShields}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    activeTab.shieldsUp ? 'bg-[#fca311] justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-[#000000] shadow-md" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#e5e5e5]">
                  <span>Trackers & Ads Blocked</span>
                  <span className="font-bold text-[#fca311]">{activeTab.blockedCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#e5e5e5]">
                  <span>HTTPS Upgrades</span>
                  <span className="font-bold text-[#fca311]">Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsShieldsModalOpen(false)}
              className="w-full py-2.5 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs transition-colors shadow-lg shadow-[#fca311]/20"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* BOOKMARKS MODAL */}
      {isBookmarksOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14213d] border border-[#14213d] rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#000000]">
              <h3 className="font-bold text-base text-[#ffffff]">Bookmarks</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportBookmarksHtml}
                  className="px-3 py-1 bg-[#fca311] text-[#000000] font-bold rounded-xl text-xs hover:bg-[#fca311]/90 transition-colors flex items-center gap-1.5"
                  title="Export Bookmarks as HTML file backup"
                >
                  <Download className="w-3 h-3" /> Export HTML
                </button>
                <button onClick={() => setIsBookmarksOpen(false)} className="p-2 rounded-xl hover:bg-[#000000] text-[#e5e5e5]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="py-4 space-y-2 max-h-64 overflow-y-auto flex-1">
              {bookmarks.map((bm, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    navigateTo(bm.url);
                    setIsBookmarksOpen(false);
                  }}
                  className="flex items-center justify-between p-3 bg-[#000000] hover:bg-[#14213d] rounded-xl cursor-pointer text-xs border border-[#14213d]"
                >
                  <span className="font-medium text-[#ffffff] truncate">{bm.title}</span>
                  <span className="text-[#e5e5e5] truncate max-w-[150px]">{bm.url}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR CODE SHARE MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14213d] border border-[#fca311]/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full pb-4 border-b border-[#000000] mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#fca311]" />
                <h3 className="font-bold text-base text-[#ffffff]">Share via QR Code</h3>
              </div>
              <button onClick={() => setIsQrModalOpen(false)} className="p-2 rounded-xl hover:bg-[#000000] text-[#e5e5e5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#e5e5e5] mb-4 truncate max-w-full font-mono">{activeTab.url}</p>

            {/* Generated QR Code Matrix Box */}
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-4 flex items-center justify-center">
              <div className="grid grid-cols-7 gap-1 w-48 h-48 bg-black p-3 rounded-xl">
                {Array.from({ length: 49 }).map((_, i) => {
                  const isDark = (i + activeTab.url.length) % 2 === 0 || i % 3 === 0 || i < 7 || i > 41 || i % 7 === 0;
                  return (
                    <div
                      key={i}
                      className={`rounded-sm ${isDark ? 'bg-black' : 'bg-white'}`}
                    />
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-[#e5e5e5] mb-6">Scan this QR code with your mobile device camera to instantly open this page in Umbra Mobile.</p>

            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeTab.url);
                  alert('URL copied to clipboard!');
                }}
                className="flex-1 py-2.5 bg-[#000000] hover:bg-[#000000]/80 text-[#fca311] border border-[#fca311]/30 font-bold rounded-xl text-xs transition-colors"
              >
                Copy URL
              </button>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 py-2.5 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME TAB MODAL */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14213d] border border-[#fca311]/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#000000] mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#fca311]" />
                <h3 className="font-bold text-base text-[#ffffff]">Rename Tab</h3>
              </div>
              <button
                onClick={() => setRenameModal({ isOpen: false, tabId: '', title: '' })}
                className="p-2 rounded-xl hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#e5e5e5] mb-4">
              Set a custom display title for this tab. This overrides the default page title in the tab bar and omnibox preview.
            </p>

            <form onSubmit={handleSaveTabRename} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#fca311] uppercase tracking-wider mb-1.5">
                  Display Title
                </label>
                <input
                  type="text"
                  value={renameModal.title}
                  onChange={(e) => setRenameModal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Research Notes, Primary Dashboard..."
                  className="w-full bg-[#000000] border border-[#14213d] focus:border-[#fca311] rounded-xl px-3.5 py-2.5 text-xs text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#fca311] transition-all"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetTabRename}
                  className="px-3 py-2 bg-[#000000] hover:bg-[#000000]/80 text-[#e5e5e5] hover:text-white border border-[#14213d] rounded-xl text-xs font-medium transition-colors"
                  title="Clear custom title and restore default webpage title"
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  onClick={() => setRenameModal({ isOpen: false, tabId: '', title: '' })}
                  className="flex-1 py-2 bg-[#14213d] hover:bg-[#14213d]/80 text-[#e5e5e5] hover:text-white border border-[#fca311]/20 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs shadow-md transition-colors"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB RIGHT-CLICK CONTEXT MENU */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-[#14213d] border border-[#fca311]/30 rounded-xl shadow-2xl py-1.5 w-48 text-xs text-[#ffffff]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const tab = tabs.find(t => t.id === contextMenu.tabId);
            if (!tab) return null;
            return (
              <>
                <button
                  onClick={() => openRenameTabModal(tab.id)}
                  className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium text-[#fca311] hover:font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Rename Tab</span>
                </button>
                <button
                  onClick={() => toggleMuteTab(tab.id)}
                  className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium"
                >
                  {tab.isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}</span>
                </button>
                <button
                  onClick={() => togglePinTab(tab.id)}
                  className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>{tab.isPinned ? 'Unpin Tab' : 'Pin Tab'}</span>
                </button>
                <button
                  onClick={() => duplicateTab(tab.id)}
                  className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate Tab</span>
                </button>
                <button
                  onClick={() => closeAllOthers(tab.id)}
                  className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Close All Others</span>
                </button>
                {tab.groupId ? (
                  <button
                    onClick={() => removeTabFromGroup(tab.id)}
                    className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Remove from Group</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openGroupTabModal(tab.id)}
                    className="w-full text-left px-4 py-2 hover:bg-[#fca311] hover:text-[#000000] flex items-center gap-2 transition-colors font-medium text-[#fca311] hover:font-bold"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Group Tab...</span>
                  </button>
                )}
                {!tab.isPinned && tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      closeTab(tab.id, e as any);
                      setContextMenu({ visible: false, x: 0, y: 0, tabId: '' });
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-600 hover:text-[#ffffff] flex items-center gap-2 transition-colors text-rose-300 font-medium border-t border-[#000000]/40"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close Tab</span>
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* GROUP TAB MODAL DIALOG */}
      {groupTabModal.isOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14213d] border border-[#fca311]/40 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#000000] mb-4">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#fca311]" />
                <h3 className="font-bold text-base text-[#ffffff]">Group Tab</h3>
              </div>
              <button
                onClick={() => setGroupTabModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-xl hover:bg-[#000000] text-[#e5e5e5] hover:text-[#ffffff] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#e5e5e5] mb-4">
              Organize your browser tabs into custom colored groups to keep related tasks structured together.
            </p>

            <form onSubmit={handleAssignTabToGroup} className="flex flex-col gap-4">
              {tabGroups.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#fca311] uppercase tracking-wider mb-1.5">
                    Select Existing Group
                  </label>
                  <select
                    value={groupTabModal.selectedExistingGroupId}
                    onChange={(e) => setGroupTabModal(prev => ({ ...prev, selectedExistingGroupId: e.target.value }))}
                    className="w-full bg-[#000000] border border-[#14213d] focus:border-[#fca311] rounded-xl px-3.5 py-2.5 text-xs text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#fca311] transition-all"
                  >
                    <option value="">-- Create New Group Below --</option>
                    {tabGroups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({tabs.filter(t => t.groupId === g.id).length} tabs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!groupTabModal.selectedExistingGroupId && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#fca311] uppercase tracking-wider mb-1.5">
                      New Group Name
                    </label>
                    <input
                      type="text"
                      value={groupTabModal.groupName}
                      onChange={(e) => setGroupTabModal(prev => ({ ...prev, groupName: e.target.value }))}
                      placeholder="e.g. Research, Project, Shopping..."
                      className="w-full bg-[#000000] border border-[#14213d] focus:border-[#fca311] rounded-xl px-3.5 py-2.5 text-xs text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#fca311] transition-all"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#fca311] uppercase tracking-wider mb-2">
                      Group Color Tag
                    </label>
                    <div className="flex items-center gap-3">
                      {['#fca311', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f97316'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setGroupTabModal(prev => ({ ...prev, groupColor: color }))}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            groupTabModal.groupColor === color ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGroupTabModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 bg-[#14213d] hover:bg-[#14213d]/80 text-[#e5e5e5] hover:text-white border border-[#fca311]/20 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#fca311] hover:bg-[#fca311]/90 text-[#000000] font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {groupTabModal.selectedExistingGroupId ? 'Move to Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAGGING TAB PREVIEW GHOST OVERLAY */}
      {draggedTabId && (
        <div
          className="fixed z-50 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: dragPos.x > 0 ? dragPos.x - 110 : 120,
            top: dragPos.y > 0 ? dragPos.y + 15 : 50
          }}
        >
          {(() => {
            const draggedTab = tabs.find(t => t.id === draggedTabId);
            if (!draggedTab) return null;
            const displayTitle = draggedTab.customTitle || draggedTab.title || 'New Tab';
            return (
              <div className="w-60 bg-[#14213d]/95 backdrop-blur-md border-2 border-[#fca311] rounded-2xl p-2.5 shadow-[0_12px_32px_rgba(252,163,17,0.4)] text-xs text-white rotate-2 scale-105">
                <div className="flex items-center justify-between text-[10px] text-[#fca311] font-bold uppercase tracking-wider mb-1.5">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#fca311]" /> Reordering Tab
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#000000]/70 text-[9px] text-white">Ghost Preview</span>
                </div>

                <div className="w-full h-20 bg-[#000000] rounded-xl border border-[#fca311]/40 flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#fca311]/25 to-transparent" />
                  <Globe className="w-5 h-5 text-[#fca311] mb-1 animate-pulse" />
                  <div className="text-[11px] font-bold text-[#ffffff] truncate max-w-full">{displayTitle}</div>
                  <div className="text-[9px] text-[#e5e5e5] truncate max-w-full font-mono mt-0.5">{draggedTab.url}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SCREENSHOT CAPTURE FLASH OVERLAY */}
      {isScreenshotCapturing && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-xs z-50 pointer-events-none transition-opacity duration-300 animate-in fade-in duration-100" />
      )}

    </div>
  );
}
