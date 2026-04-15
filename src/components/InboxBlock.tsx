import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { useInbox, useDmMessages, useSendDm, useMarkRead } from "@/lib/queries";

interface ProjectMsg {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
  project_title: string;
}

interface DmConversation {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  peer_id: string;
  peer_first_name: string;
  peer_last_name: string;
}

interface DmMsg {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_first_name: string;
  sender_last_name: string;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function InboxBlock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: inbox, isLoading } = useInbox();
  const [tab, setTab] = useState<"projects" | "personal">("projects");
  const [openDmPeer, setOpenDmPeer] = useState<{ id: string; name: string } | null>(null);
  const [dmInput, setDmInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const markRead = useMarkRead();

  const { data: dmMessages = [] } = useDmMessages(openDmPeer?.id);
  const sendDmMutation = useSendDm(user ? { id: user.id, first_name: user.first_name, last_name: user.last_name } : undefined);

  const projectMessages = (inbox?.project_messages || []) as ProjectMsg[];
  const dmConversations = (inbox?.dm_conversations || []) as DmConversation[];

  useEffect(() => {
    if (openDmPeer && chatRef.current) {
      chatRef.current.scrollTo(0, chatRef.current.scrollHeight);
    }
  }, [dmMessages, openDmPeer]);

  const handleSendDm = async () => {
    if (!dmInput.trim() || !openDmPeer) return;
    try {
      await sendDmMutation.mutateAsync({ receiver_id: openDmPeer.id, content: dmInput.trim() });
      setDmInput("");
    } catch { /* empty */ }
  };

  const handleOpenDm = (peerId: string, peerName: string) => {
    setOpenDmPeer({ id: peerId, name: peerName });
    markRead.mutate({ peer_id: peerId });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="animate-pulse text-stone-mid text-sm text-center py-6">Загрузка сообщений...</div>
      </div>
    );
  }

  if (openDmPeer) {
    return (
      <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setOpenDmPeer(null)} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <Icon name="ArrowLeft" size={16} className="text-stone-mid" />
          </button>
          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {openDmPeer.name[0]}
          </div>
          <span className="font-semibold text-stone text-sm">{openDmPeer.name}</span>
        </div>
        <div ref={chatRef} className="flex-1 space-y-2 overflow-y-auto max-h-64 mb-3">
          {(dmMessages as DmMsg[]).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-stone-mid">Начните переписку</p>
            </div>
          ) : (dmMessages as DmMsg[]).map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-2.5 py-1.5 ${isMe ? "terra-gradient" : "bg-muted"}`}>
                  <p className={`text-xs ${isMe ? "text-white" : "text-stone"}`}>{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? "text-white/60" : "text-stone-light"}`}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            value={dmInput}
            onChange={e => setDmInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendDm()}
            placeholder="Написать сообщение..."
            className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-stone text-xs placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terra/20"
          />
          <button onClick={handleSendDm} disabled={!dmInput.trim() || sendDmMutation.isPending} className="w-8 h-8 terra-gradient rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40">
            <Icon name="Send" size={13} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 terra-gradient rounded-lg flex items-center justify-center">
          <Icon name="Inbox" size={13} className="text-white" />
        </div>
        <span className="font-semibold text-stone text-sm">Входящие</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-0.5 mb-4">
        <button
          onClick={() => setTab("projects")}
          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${tab === "projects" ? "bg-white text-stone shadow-sm" : "text-stone-mid hover:text-stone"}`}
        >
          По проектам {projectMessages.length > 0 && `(${projectMessages.length})`}
        </button>
        <button
          onClick={() => setTab("personal")}
          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${tab === "personal" ? "bg-white text-stone shadow-sm" : "text-stone-mid hover:text-stone"}`}
        >
          Личные {dmConversations.length > 0 && `(${dmConversations.length})`}
        </button>
      </div>

      {tab === "projects" && (
        <div className="space-y-1">
          {projectMessages.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon name="MessagesSquare" size={18} className="text-stone-light" />
              </div>
              <p className="text-xs text-stone-mid">Нет сообщений по проектам</p>
            </div>
          ) : projectMessages.map(msg => (
            <button
              key={msg.id}
              onClick={() => navigate(`/project/${msg.project_id}`)}
              className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-terra-pale rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name="FolderOpen" size={14} className="text-terra" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-stone truncate">{msg.project_title}</span>
                    <span className="text-[10px] text-stone-light whitespace-nowrap flex-shrink-0">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-stone-mid truncate">
                    <span className="font-medium text-stone">{msg.sender_first_name}:</span> {msg.content}
                  </p>
                </div>
                {!msg.is_read && msg.sender_id !== user?.id && (
                  <div className="w-2 h-2 bg-terra rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "personal" && (
        <div className="space-y-1">
          {dmConversations.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon name="MessageCircle" size={18} className="text-stone-light" />
              </div>
              <p className="text-xs text-stone-mid">Нет личных сообщений</p>
              <p className="text-[10px] text-stone-light mt-1">Напишите дизайнеру из Гильдии или участнику Команды</p>
            </div>
          ) : dmConversations.map(conv => {
            const peerName = `${conv.peer_first_name} ${conv.peer_last_name}`.trim();
            const isUnread = !conv.is_read && conv.receiver_id === user?.id;
            return (
              <button
                key={conv.id}
                onClick={() => handleOpenDm(conv.peer_id, peerName)}
                className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {conv.peer_first_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-stone truncate">{peerName}</span>
                      <span className="text-[10px] text-stone-light whitespace-nowrap flex-shrink-0">{timeAgo(conv.created_at)}</span>
                    </div>
                    <p className="text-xs text-stone-mid truncate">{conv.content}</p>
                  </div>
                  {isUnread && <div className="w-2 h-2 bg-terra rounded-full flex-shrink-0 mt-2" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
