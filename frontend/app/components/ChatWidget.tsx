"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { backendBaseUrl } from "@/lib/urls";

type ChatMessage = {
  id: string;
  sessionId?: string;
  sender: "visitor" | "admin";
  text: string;
  attachments?: ChatAttachment[];
  createdAt: string;
};

type ChatAttachment = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  size: number;
};

type AdminProfile = {
  id: string;
  name: string;
  avatar?: string;
};

export default function ChatWidget() {
  const [chatOpen, setChatOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [quickLinks, setQuickLinks] = useState<{
    whatsapp: { enabled: boolean; href: string };
    line: { enabled: boolean; href: string };
    phone: { enabled: boolean; href: string; label?: string };
  } | null>(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherPinned, setLauncherPinned] = useState(false);
  const [sessionAdmins, setSessionAdmins] = useState<AdminProfile[]>([]);
  const [typingAdmins, setTypingAdmins] = useState<AdminProfile[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingMessageRef = useRef<{
    id: string;
    text: string;
    attachments?: ChatAttachment[];
  } | null>(null);
  const queuedMessageRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingAdminsRef = useRef<Map<string, AdminProfile>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedVisitorId = window.localStorage.getItem("visitorId");
    if (storedVisitorId) setVisitorId(storedVisitorId);

    const storedAuth = window.localStorage.getItem("customerAuth");
    if (storedAuth === "true") {
      setIsAuthed(true);
    }

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get("auth_success");
    const authData = urlParams.get("auth_data");
    const authError = urlParams.get("auth_error");

    if (authSuccess === "true" && authData) {
      try {
        const decoded = JSON.parse(atob(authData));
        window.localStorage.setItem("customerAuth", "true");
        window.localStorage.setItem("customerProvider", decoded.provider);
        if (decoded.email) window.localStorage.setItem("customerEmail", decoded.email);
        if (decoded.name) window.localStorage.setItem("customerName", decoded.name);
        if (decoded.picture) window.localStorage.setItem("customerPicture", decoded.picture);
        if (decoded.lineUserId) window.localStorage.setItem("customerLineId", decoded.lineUserId);

        setIsAuthed(true);
        setChatOpen(true);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Send queued message if any
        if (queuedMessageRef.current) {
          const queued = queuedMessageRef.current;
          queuedMessageRef.current = null;
          setInput(queued);
          sendMessage(queued);
        }
      } catch (err) {
        console.error("Failed to parse auth data", err);
      }
    } else if (authError) {
      console.error(`Authentication failed: ${authError}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const fetchQuickLinks = async () => {
      try {
        const res = await fetch(`${backendBaseUrl}/quick-links`);
        if (res.ok) {
          const data = await res.json();
          if (data.links) {
            setQuickLinks(data.links);
          }
        }
      } catch (err) {
        console.error("Failed to fetch quick links", err);
      }
    };
    fetchQuickLinks();
  }, []);

  const initializingRef = useRef<Promise<string | null> | null>(null);

  const ensureSession = async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (sessionId) {
      sessionIdRef.current = sessionId;
      return sessionId;
    }
    // Prevent concurrent initialization
    if (initializingRef.current) {
      return initializingRef.current;
    }

    const initPromise = (async () => {
      setConnecting(true);
      try {
        // effective visitor ID
        const vid = visitorId;
        // gather current auth info if available
        const cEmail = typeof window !== "undefined" ? window.localStorage.getItem("customerEmail") : null;
        const cPhone = typeof window !== "undefined" ? window.localStorage.getItem("customerPhone") : null;
        const cProvider = typeof window !== "undefined" ? window.localStorage.getItem("customerProvider") : null;

        const response = await fetch(`${backendBaseUrl}/chat/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId: vid,
            customerEmail: cEmail,
            customerPhone: cPhone,
            authProvider: cProvider
          }),
        });
        if (!response.ok) throw new Error("Failed to create session");
        const data = await response.json();

        if (!visitorId && data.visitorId && typeof window !== "undefined") {
          window.localStorage.setItem("visitorId", data.visitorId);
          setVisitorId(data.visitorId);
        }
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
        return data.sessionId as string;
      } catch (err) {
        console.error("Chat session error:", err);
        return null;
      } finally {
        setConnecting(false);
        initializingRef.current = null;
      }
    })();

    initializingRef.current = initPromise;
    return initPromise;
  };

  // ... (connectSocket, useEffects as is)

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("customerAuth");
      window.localStorage.removeItem("customerEmail");
      window.localStorage.removeItem("customerProvider");
    }
    setIsAuthed(false);
    setChatOpen(false);
  };

  const connectSocket = async () => {
    const activeSessionId = await ensureSession();
    if (!activeSessionId) return; // Failed to init session

    if (socketRef.current) return;
    const socket = io(backendBaseUrl, {
      auth: { role: "visitor", sessionId: activeSessionId },
    });
    socketRef.current = socket;

    socket.on("connect", async () => {
      console.log("Socket connected:", socket.id);

      // Fetch history on connect
      try {
        const historyResponse = await fetch(
          `${backendBaseUrl}/chat/sessions/${activeSessionId}/messages`
        );
        const historyData = await historyResponse.json();
        setMessages(historyData.messages || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }

      if (pendingMessageRef.current) {
        const { id, text, attachments } = pendingMessageRef.current;
        pendingMessageRef.current = null;
        sendMessage(text, id, attachments);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket.on("message", (message: ChatMessage) => {
      setMessages((prev) => {
        const index = prev.findIndex((item) => item.id === message.id);
        if (index === -1) return [...prev, message];
        const next = [...prev];
        next[index] = message;
        return next;
      });
    });

    socket.on(
      "sessionAdmins",
      (payload: { sessionId: string; admins?: AdminProfile[] }) => {
        if (payload.sessionId === activeSessionId) {
          setSessionAdmins(payload.admins || []);
        }
      }
    );

    socket.on(
      "typing",
      (payload: {
        sessionId: string;
        role: "admin" | "visitor";
        adminId?: string;
        name?: string;
        avatar?: string;
        isTyping?: boolean;
      }) => {
        if (payload.sessionId !== activeSessionId) return;
        if (payload.role !== "admin" || !payload.adminId) return;
        if (payload.isTyping) {
          typingAdminsRef.current.set(payload.adminId, {
            id: payload.adminId,
            name: payload.name || "Admin",
            avatar: payload.avatar || "",
          });
        } else {
          typingAdminsRef.current.delete(payload.adminId);
        }
        setTypingAdmins(Array.from(typingAdminsRef.current.values()));
      }
    );

    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });
  };

  useEffect(() => {
    if (chatOpen && !socketRef.current) {
      connectSocket();
    } else if (!chatOpen && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [chatOpen]);

  useEffect(() => {
    if (isAuthed && chatOpen && !socketRef.current) {
      connectSocket();
    }
  }, [isAuthed, chatOpen]);

  const sendMessage = async (
    messageText: string,
    messageId?: string,
    attachments?: ChatAttachment[]
  ) => {
    const trimmedText = messageText.trim();
    if (!trimmedText && (!attachments || attachments.length === 0)) return;
    const activeSessionId = sessionIdRef.current;
    const clientMessageId =
      messageId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!socketRef.current || !socketRef.current.connected) {
      pendingMessageRef.current = {
        id: clientMessageId,
        text: trimmedText,
        attachments,
      };
      await connectSocket();
      return;
    }

    if (!activeSessionId) {
      console.error("No session ID available to send message.");
      return;
    }

    const payload = {
      id: clientMessageId,
      sessionId: activeSessionId,
      sender: "visitor",
      text: trimmedText,
      attachments: attachments || [],
    };
    setMessages((prev) => [
      ...prev,
      {
        id: clientMessageId,
        sessionId: activeSessionId,
        sender: "visitor",
        text: trimmedText,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
      },
    ]);
    socketRef.current?.emit("message", payload);
    socketRef.current?.emit("typing", {
      sessionId: activeSessionId,
      isTyping: false,
    });
    setInput("");
  };

  const handleTypingChange = (value: string) => {
    setInput(value);
    const activeSessionId = sessionIdRef.current || sessionId;
    if (!activeSessionId || !socketRef.current) return;
    const isTyping = Boolean(value.trim());
    socketRef.current.emit("typing", { sessionId: activeSessionId, isTyping });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing", {
          sessionId: activeSessionId,
          isTyping: false,
        });
      }, 1600);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return "";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const activeSessionId = await ensureSession();
      if (!activeSessionId) {
        throw new Error("Unable to create session");
      }
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(
        `${backendBaseUrl}/chat/sessions/${activeSessionId}/attachments`,
        { method: "POST", body: formData }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || "Upload failed");
      }
      const data = await response.json();
      const attachment = data.attachment as ChatAttachment;
      await sendMessage("", undefined, [attachment]);
    } catch (error) {
      console.error("Attachment upload failed", error);
      console.error(
        error instanceof Error ? error.message : "Unable to upload file."
      );
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openChatWithAuth = () => {
    setChatOpen(true);
  };

  useEffect(() => {
    if (chatOpen) {
      setLauncherOpen(false);
    }
  }, [chatOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const presetMessage = detail?.message || "";

      // Open chat without requiring auth
      setChatOpen(true);
      setInput(presetMessage);

      if (!isAuthed) {
        queuedMessageRef.current = presetMessage;
      } else if (presetMessage.trim()) {
        sendMessage(presetMessage);
      }
    };
    window.addEventListener("openChat", handleOpenChat);
    return () => window.removeEventListener("openChat", handleOpenChat);
  }, [isAuthed, sendMessage]);

  return (
    <>
      <div
        className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3"
        onMouseEnter={() => !chatOpen && setLauncherOpen(true)}
        onMouseLeave={() => !launcherPinned && setLauncherOpen(false)}
      >
        <div
          className={`flex flex-col items-end gap-3 transition ${launcherOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
        >
          {quickLinks?.whatsapp?.enabled && quickLinks.whatsapp.href && (
            <a
              href={quickLinks.whatsapp.href}
              target="_blank"
              rel="noreferrer"
              className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
              aria-label="WhatsApp"
            >
              <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg opacity-0 transition group-hover:opacity-100">
                WhatsApp
              </span>
              <svg
                viewBox="0 0 32 32"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M19.11 17.48c-.29-.14-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.74.94-.9 1.13-.17.19-.33.22-.62.07-.29-.14-1.2-.44-2.29-1.41-.85-.76-1.42-1.69-1.59-1.98-.17-.29-.02-.45.12-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.46-.48-.64-.49-.16-.01-.36-.01-.55-.01-.19 0-.5.07-.77.36-.26.29-1.01.99-1.01 2.41s1.04 2.79 1.19 2.98c.14.19 2.05 3.12 4.97 4.38.7.3 1.25.48 1.67.61.7.22 1.33.19 1.83.11.56-.08 1.7-.69 1.94-1.35.24-.66.24-1.22.17-1.35-.07-.12-.26-.19-.55-.33zM16.02 6.67c-5.06 0-9.18 4.12-9.18 9.18 0 1.62.42 3.14 1.16 4.46l-1.23 4.49 4.6-1.21a9.14 9.14 0 0 0 4.65 1.27c5.06 0 9.18-4.12 9.18-9.18s-4.12-9.18-9.18-9.18zm0 16.7c-1.46 0-2.83-.42-4-1.15l-.29-.18-2.73.72.73-2.66-.19-.31a7.46 7.46 0 1 1 6.48 3.58z" />
              </svg>
            </a>
          )}
          {quickLinks?.line?.enabled && quickLinks.line.href && (
            <a
              href={quickLinks.line.href}
              target="_blank"
              rel="noreferrer"
              className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg"
              aria-label="Line OA"
            >
              <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg opacity-0 transition group-hover:opacity-100">
                LINE OA
              </span>
              <svg
                viewBox="0 0 36 36"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M18 6C11.37 6 6 10.26 6 15.5c0 3.02 1.76 5.68 4.5 7.39V30l4.48-2.46c.97.2 2 .31 3.02.31 6.63 0 12-4.26 12-9.5S24.63 6 18 6zm-4.25 11c-.83 0-1.5-.67-1.5-1.5S12.92 14 13.75 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.25 0c-.83 0-1.5-.67-1.5-1.5S17.17 14 18 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.25 0c-.83 0-1.5-.67-1.5-1.5S21.42 14 22.25 14s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </a>
          )}
          {quickLinks?.phone?.enabled && quickLinks.phone.href && (
            <a
              href={quickLinks.phone.href}
              className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-lg"
              aria-label="Phone"
            >
              <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg opacity-0 transition group-hover:opacity-100">
                {quickLinks.phone.label ||
                  quickLinks.phone.href.replace(/^tel:/, "")}
              </span>
              ☎
            </a>
          )}
          <button
            onClick={openChatWithAuth}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg"
            aria-label="Chat"
          >
            <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-lg opacity-0 transition group-hover:opacity-100">
              Chat with us
            </span>
            💬
          </button>
        </div>
        <button
          onClick={() =>
            setLauncherPinned((prev) => {
              const next = !prev;
              setLauncherOpen(next);
              return next;
            })
          }
          className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/40"
          aria-label="เปิดแชทกับแอดมิน"
        >
          💬
        </button>
      </div>

      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-white shadow-2xl shadow-slate-900/30 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[420px] sm:rounded-3xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">
                แชทกับทีมงาน {!isAuthed && <span className="text-xs opacity-75">(Guest)</span>}
              </p>
              <p className="text-xs text-slate-200">
                {connecting ? "กำลังเชื่อมต่อ..." : "ออนไลน์"}
              </p>
              {sessionAdmins.length > 0 && (
                <div className="mt-2 flex -space-x-2">
                  {sessionAdmins.slice(0, 4).map((admin) => (
                    <div
                      key={admin.id}
                      className="h-6 w-6 rounded-full border-2 border-slate-900 bg-white text-[9px] font-semibold text-slate-600 flex items-center justify-center overflow-hidden"
                      title={admin.name}
                    >
                      {admin.avatar ? (
                        <img
                          src={admin.avatar}
                          alt={admin.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        admin.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <button onClick={() => setChatOpen(false)}>ปิด</button>
              {isAuthed && (
                <>
                  <span className="opacity-50">|</span>
                  <button onClick={handleLogout}>ออกจากระบบ</button>
                </>
              )}
              {!isAuthed && <span className="opacity-50">| Guest</span>}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-slate-50 px-4 py-4 text-sm sm:h-[450px] sm:flex-none">
            {!isAuthed && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold mb-1">💬 Chatting as Guest</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  You can start chatting without signing in. To continue your conversation later or access booking history, please use the Sign-in button in the top menu.
                </p>
              </div>
            )}
            {messages.length === 0 && (
              <p className="text-center text-xs text-slate-400">
                เริ่มต้นการสนทนาได้เลย
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${message.sender === "visitor"
                  ? "self-end bg-slate-900 text-white"
                  : "self-start bg-white text-slate-700"
                  }`}
              >
                {message.text && (
                  <div className="text-[11px] leading-relaxed break-all">
                    {message.text.split("\n").map((line, index) => (
                      <p key={index} className={index ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {message.attachments?.length ? (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment) => {
                      const isImage = attachment.mime?.startsWith("image/");
                      return (
                        <div
                          key={attachment.id}
                          className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-700"
                        >
                          {isImage ? (
                            <img
                              src={attachment.url}
                              alt={attachment.filename}
                              className="h-auto w-full rounded-lg"
                            />
                          ) : (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-blue-600 underline"
                            >
                              {attachment.filename}
                            </a>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">
                            {attachment.mime} · {formatBytes(attachment.size)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
            {typingAdmins.length > 0 && (
              <p className="text-[10px] text-slate-400">
                {typingAdmins.length === 1
                  ? `${typingAdmins[0].name} typing...`
                  : "Admins typing..."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleAttachmentUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAttachment}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
            >
              {uploadingAttachment ? "Uploading" : "Attach"}
            </button>
            <input
              value={input}
              onChange={(event) => handleTypingChange(event.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs"
              placeholder="พิมพ์ข้อความ..."
              aria-label="พิมพ์ข้อความ"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={
                !input.trim() ||
                uploadingAttachment
              }
              className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ส่ง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
