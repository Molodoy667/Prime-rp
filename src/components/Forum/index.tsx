import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Bug,
  Camera,
  ChevronRight,
  Edit3,
  Eye,
  LifeBuoy,
  Lock,
  LogIn,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  MessagesSquare,
  Plus,
  Repeat2,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  ThumbsUp,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";
import {
  forumCategories as seedCategories,
  forumReplies as seedReplies,
  forumTopics as seedTopics,
  loadForumUser,
  roleLabel,
  saveForumUser,
  type ForumCategory,
  type ForumReply,
  type ForumRole,
  type ForumTopic,
  type ForumUser,
} from "../../data/forum";

type ForumView = "home" | "login" | "register" | "account";
const iconMap: Record<string, typeof Megaphone> = {
  megaphone: Megaphone,
  messages: MessagesSquare,
  "life-buoy": LifeBuoy,
  bug: Bug,
  shield: Shield,
  briefcase: BriefcaseBusiness,
  repeat: Repeat2,
  camera: Camera,
};
const canModerate = (user: ForumUser | null) =>
  user?.role === "admin" || user?.role === "moderator";
const canAdmin = (user: ForumUser | null) => user?.role === "admin";
function RoleBadge({ role }: { role: ForumRole }) {
  return (
    <span className={`forum-role forum-role-${role}`}>{roleLabel[role]}</span>
  );
}
function Avatar({ name, role }: { name: string; role: ForumRole }) {
  return (
    <span className={`forum-avatar forum-avatar-${role}`}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function Forum() {
  const [user, setUser] = useState<ForumUser | null>(() => loadForumUser());
  const [view, setView] = useState<ForumView>("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [query, setQuery] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>(() =>
    read("prime-forum-categories", seedCategories),
  );
  const [topics, setTopics] = useState<ForumTopic[]>(() =>
    read("prime-forum-topics", seedTopics),
  );
  const [replies, setReplies] = useState<ForumReply[]>(() =>
    read("prime-forum-replies", seedReplies),
  );
  const [stats, setStats] = useState({ members: 0, topics: 0, online: 0 });
  const [modal, setModal] = useState<
    "topic" | "category" | "edit-topic" | "edit-reply" | null
  >(null);
  const [editingReply, setEditingReply] = useState<ForumReply | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newParent, setNewParent] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [profile, setProfile] = useState<ForumUser | null>(user);
  const [accountTab, setAccountTab] = useState<"profile" | "manage">("profile");
  useEffect(() => {
    fetch("/api/forum")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        setCategories(data.categories);
        setTopics(data.topics);
        setReplies(data.replies);
        setStats(data.stats);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    localStorage.setItem("prime-forum-categories", JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem("prime-forum-topics", JSON.stringify(topics));
  }, [topics]);
  useEffect(() => {
    localStorage.setItem("prime-forum-replies", JSON.stringify(replies));
  }, [replies]);
  const category = selectedCategory
    ? categories.find((item) => item.id === selectedCategory)
    : null;
  const visibleTopics = useMemo(
    () =>
      topics.filter(
        (topic) =>
          (!selectedCategory || topic.categoryId === selectedCategory) &&
          (!query ||
            `${topic.title} ${topic.excerpt} ${topic.tags.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [topics, selectedCategory, query],
  );
  const goHome = () => {
    setView("home");
    setSelectedTopic(null);
    setModal(null);
  };
  const login = async (loginName: string, password: string) => {
    try {
      const response = await fetch("/api/forum-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const next = data.user as ForumUser;
      saveForumUser(next);
      setUser(next);
      setProfile(next);
      setLoginError("");
      setView("home");
    } catch {
      setLoginError("Невірний логін або пароль.");
    }
  };
  const logout = () => {
    saveForumUser(null);
    setUser(null);
    setProfile(null);
    setView("home");
  };
  const requireAuth = () => {
    if (!user) setView("login");
    else {
      setNewTitle("");
      setNewBody("");
      setModal("topic");
    }
  };
  const createTopic = async () => {
    if (!user || !newTitle.trim() || !newBody.trim()) return;
    await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-topic",
        userId: user.id,
        categoryId: selectedCategory || categories[0]?.id,
        title: newTitle,
        body: newBody,
      }),
    });
    const response = await fetch("/api/forum");
    const data = await response.json();
    setCategories(data.categories);
    setTopics(data.topics);
    setReplies(data.replies);
    setNewTitle("");
    setNewBody("");
    setModal(null);
  };
  const updateTopic = () => {
    if (
      !selectedTopic ||
      !newTitle.trim() ||
      !newBody.trim() ||
      !user ||
      !(selectedTopic.author === user.username || canAdmin(user))
    )
      return;
    const updated = {
      ...selectedTopic,
      title: newTitle.trim(),
      excerpt: newBody.trim(),
      edited: true,
    };
    setTopics(topics.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedTopic(updated);
    setModal(null);
  };
  const removeTopic = (topic: ForumTopic) => {
    if (
      !user ||
      !(topic.author === user.username || canAdmin(user)) ||
      !window.confirm("Видалити тему та всі відповіді?")
    )
      return;
    setTopics(topics.filter((item) => item.id !== topic.id));
    setReplies(replies.filter((item) => item.topicId !== topic.id));
    setSelectedTopic(null);
  };
  const addReply = async () => {
    if (!user || !selectedTopic || !replyBody.trim() || selectedTopic.locked)
      return;
    await fetch("/api/forum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-reply",
        userId: user.id,
        topicId: selectedTopic.id,
        body: replyBody,
      }),
    });
    const response = await fetch("/api/forum");
    const data = await response.json();
    setCategories(data.categories);
    setTopics(data.topics);
    setReplies(data.replies);
    setReplyBody("");
  };
  const updateReply = () => {
    if (
      !user ||
      !editingReply ||
      !replyBody.trim() ||
      !(editingReply.author === user.username || canAdmin(user))
    )
      return;
    setReplies(
      replies.map((item) =>
        item.id === editingReply.id
          ? { ...item, body: replyBody.trim(), edited: true }
          : item,
      ),
    );
    setModal(null);
    setEditingReply(null);
    setReplyBody("");
  };
  const removeReply = (reply: ForumReply) => {
    if (
      !user ||
      !(reply.author === user.username || canAdmin(user)) ||
      !window.confirm("Видалити відповідь?")
    )
      return;
    setReplies(replies.filter((item) => item.id !== reply.id));
    setTopics(
      topics.map((item) =>
        item.id === reply.topicId
          ? { ...item, replies: Math.max(0, item.replies - 1) }
          : item,
      ),
    );
  };
  const moderate = (action: "lock" | "pin") => {
    if (!selectedTopic || !canModerate(user)) return;
    const key = action === "lock" ? "locked" : "pinned";
    const updated = { ...selectedTopic, [key]: !selectedTopic[key] };
    setTopics(topics.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedTopic(updated);
  };
  const createCategory = () => {
    if (!canAdmin(user) || !newTitle.trim()) return;
    if (editingCategory) {
      setCategories(
        categories.map((item) =>
          item.id === editingCategory
            ? {
                ...item,
                title: newTitle.trim(),
                description: newDescription.trim() || item.description,
                parentId: newParent || undefined,
              }
            : item,
        ),
      );
    } else {
      const item: ForumCategory = {
        id: `category-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim() || "Новий розділ спільноти PRIME RP",
        icon: "messages",
        color: "#d6a84b",
        topics: 0,
        posts: 0,
        parentId: newParent || undefined,
      };
      setCategories([...categories, item]);
    }
    setEditingCategory(null);
    setNewTitle("");
    setNewDescription("");
    setNewParent("");
    setModal(null);
  };
  const editCategory = (item: ForumCategory) => {
    setEditingCategory(item.id);
    setNewTitle(item.title);
    setNewDescription(item.description);
    setNewParent(item.parentId ?? "");
    setModal("category");
  };
  const deleteCategory = (item: ForumCategory) => {
    if (!canAdmin(user) || !window.confirm(`Видалити розділ «${item.title}»?`))
      return;
    const ids = new Set([
      item.id,
      ...categories
        .filter((child) => child.parentId === item.id)
        .map((child) => child.id),
    ]);
    setCategories(
      categories.filter((categoryItem) => !ids.has(categoryItem.id)),
    );
    setTopics(topics.filter((topic) => !ids.has(topic.categoryId)));
    if (selectedCategory && ids.has(selectedCategory))
      setSelectedCategory(null);
  };
  const saveProfile = () => {
    if (!user || !profile) return;
    const next = {
      ...user,
      username: profile.username.trim() || user.username,
      email: profile.email.trim(),
      bio: profile.bio?.trim(),
      city: profile.city?.trim(),
      discord: profile.discord?.trim(),
      phone: profile.phone?.trim(),
    };
    saveForumUser(next);
    setUser(next);
    setProfile(next);
  };

  return (
    <div className="forum-page">
      <header className="forum-header">
        <div className="forum-header-inner">
          <a
            href="/#home"
            className="forum-brand"
            aria-label="PRIME RP — на головну"
          >
            <img src="/assets/logo.webp" alt="" />
            <span>
              PRIME<em>RP</em>
              <small>OFFICIAL COMMUNITY</small>
            </span>
          </a>
          <button
            className="forum-menu-btn"
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Відкрити навігацію"
          >
            {mobileNav ? <X /> : <Menu />}
          </button>
          <nav className={`forum-nav ${mobileNav ? "is-open" : ""}`}>
            <button onClick={goHome}>ФОРУМ</button>
            <a href="/#news">НОВИНИ</a>
            <a href="/#home">НА ГОЛОВНУ</a>
            {user ? (
              <button
                className="forum-user-nav"
                onClick={() => {
                  setProfile(user);
                  setView("account");
                }}
              >
                <Avatar name={user.username} role={user.role} />
                <span>{user.username}</span>
              </button>
            ) : (
              <button
                className="forum-login-nav"
                onClick={() => setView("login")}
              >
                <LogIn size={16} /> УВІЙТИ
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="forum-main">
        {view === "login" && (
          <AuthCard
            mode="login"
            onSubmit={login}
            onSwitch={() => {
              setView("register");
              setLoginError("");
            }}
            error={loginError}
            onBack={goHome}
          />
        )}{" "}
        {view === "register" && (
          <AuthCard
            mode="register"
            onSubmit={async (loginName, password, email) => {
              try {
                const response = await fetch("/api/forum-auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "register",
                    login: loginName,
                    password,
                    email,
                  }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                const next = data.user as ForumUser;
                saveForumUser(next);
                setUser(next);
                setProfile(next);
                setLoginError("");
                setView("home");
              } catch (error) {
                setLoginError(
                  error instanceof Error
                    ? error.message
                    : "Не вдалося зареєструватися.",
                );
              }
            }}
            onSwitch={() => {
              setView("login");
              setLoginError("");
            }}
            error={loginError}
            onBack={goHome}
          />
        )}{" "}
        {view === "account" && user && (
          <Account
            user={user}
            profile={profile ?? user}
            setProfile={setProfile}
            tab={accountTab}
            setTab={setAccountTab}
            categories={categories}
            onSave={saveProfile}
            onBack={goHome}
            onLogout={logout}
            onCreateCategory={() => {
              setEditingCategory(null);
              setNewTitle("");
              setNewDescription("");
              setModal("category");
            }}
            onEditCategory={editCategory}
            onDeleteCategory={deleteCategory}
          />
        )}{" "}
        {view === "home" && (
          <>
            <section className="forum-hero">
              <div>
                <p className="forum-kicker">
                  <span /> PRIME RP COMMUNITY
                </p>
                <h1>
                  ОФІЦІЙНИЙ
                  <br />
                  <em>ФОРУМ</em>
                </h1>
                <p>
                  Місце, де гравці зустрічаються, обговорюють світ PRIME та
                  створюють його майбутнє.
                </p>
              </div>
              <div className="forum-hero-mark">
                <ShieldCheck size={42} />
                <span>
                  ПЕРЕВІРЕНА
                  <br />
                  СПІЛЬНОТА
                </span>
              </div>
            </section>
            <section className="forum-toolbar">
              <div className="forum-breadcrumb">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedTopic(null);
                  }}
                >
                  ФОРУМ
                </button>
                {category && (
                  <>
                    <ChevronRight size={15} />
                    <span>{category.title}</span>
                  </>
                )}
              </div>
              <label className="forum-search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Пошук тем та повідомлень"
                  aria-label="Пошук на форумі"
                />
              </label>
              <button className="forum-create-btn" onClick={requireAuth}>
                <Plus size={17} /> СТВОРИТИ ТЕМУ
              </button>
            </section>
            {selectedTopic ? (
              <TopicView
                topic={selectedTopic}
                replies={replies.filter(
                  (reply) => reply.topicId === selectedTopic.id,
                )}
                user={user}
                body={replyBody}
                setBody={setReplyBody}
                onBack={() => setSelectedTopic(null)}
                onReply={addReply}
                onLogin={() => setView("login")}
                onModerate={moderate}
                onEditTopic={() => {
                  setNewTitle(selectedTopic.title);
                  setNewBody(selectedTopic.excerpt);
                  setModal("edit-topic");
                }}
                onDeleteTopic={() => removeTopic(selectedTopic)}
                onEditReply={(reply) => {
                  setEditingReply(reply);
                  setReplyBody(reply.body);
                  setModal("edit-reply");
                }}
                onDeleteReply={removeReply}
              />
            ) : (
              <>
                <section className="forum-layout">
                  <aside className="forum-sidebar">
                    <div className="forum-side-head">
                      <span>РОЗДІЛИ</span>
                      <small>{categories.length} категорій</small>
                    </div>
                    {categories.map((item) => {
                      const Icon = iconMap[item.icon] ?? MessageCircle;
                      return (
                        <button
                          key={item.id}
                          className={`forum-category-nav ${selectedCategory === item.id ? "active" : ""}`}
                          onClick={() => setSelectedCategory(item.id)}
                        >
                          <Icon size={18} color={item.color} />
                          <span>
                            <strong>
                              {item.parentId && "↳ "}
                              {item.title}
                            </strong>
                            <small>{item.description}</small>
                          </span>
                          <ChevronRight size={15} />
                        </button>
                      );
                    })}
                  </aside>
                  <div className="forum-content">
                    <div className="forum-content-head">
                      <div>
                        <p className="forum-kicker">
                          <span /> {category ? "РОЗДІЛ" : "ОГЛЯД СПІЛЬНОТИ"}
                        </p>
                        <h2>{category?.title ?? "ОБГОВОРЕННЯ PRIME RP"}</h2>
                      </div>
                      <span className="forum-count">
                        {visibleTopics.length} тем
                      </span>
                    </div>
                    {visibleTopics.length ? (
                      <div className="forum-topic-list">
                        {visibleTopics.map((topic) => (
                          <TopicRow
                            key={topic.id}
                            topic={topic}
                            onClick={() => setSelectedTopic(topic)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="forum-empty">
                        <MessageCircle size={32} />
                        <h3>Тут поки тихо</h3>
                        <p>Станьте першим, хто створить тему.</p>
                        <button
                          className="forum-create-btn"
                          onClick={requireAuth}
                        >
                          <Plus size={16} /> СТВОРИТИ ТЕМУ
                        </button>
                      </div>
                    )}
                  </div>
                </section>
                <section className="forum-bottom-grid">
                  <div className="forum-stat-card">
                    <div>
                      <span className="forum-kicker">
                        <span /> LIVE COMMUNITY
                      </span>
                      <h3>СПІЛЬНОТА В РУХІ</h3>
                      <p>
                        Обговорюйте оновлення, допомагайте новачкам і знаходьте
                        свою команду.
                      </p>
                    </div>
                    <div className="forum-stats">
                      <strong>
                        1 248<small>УЧАСНИКІВ</small>
                      </strong>
                      <strong>
                        {topics.length}
                        <small>ТЕМ У MOCK</small>
                      </strong>
                      <strong>
                        36<small>ОНЛАЙН</small>
                      </strong>
                    </div>
                  </div>
                  <div className="forum-account-card">
                    {user ? (
                      <>
                        <Avatar name={user.username} role={user.role} />
                        <div>
                          <span>ВИ УВІЙШЛИ ЯК</span>
                          <strong>{user.username}</strong>
                          <RoleBadge role={user.role} />
                        </div>
                        <button
                          onClick={() => {
                            setProfile(user);
                            setView("account");
                          }}
                          aria-label="Профіль"
                        >
                          <Settings size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="forum-account-icon">
                          <UserPlus size={24} />
                        </div>
                        <div>
                          <strong>Приєднуйтесь до PRIME</strong>
                          <span>
                            Увійдіть, щоб створювати теми та відповідати.
                          </span>
                        </div>
                        <button onClick={() => setView("login")}>
                          <ArrowRight size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
      <footer className="forum-footer">
        <a href="/#home">
          PRIME<em>RP</em>
        </a>
        <span>ОФІЦІЙНА СПІЛЬНОТА · 2026</span>
        <a href="/#home">
          ПОВЕРНУТИСЯ НА САЙТ <ArrowRight size={14} />
        </a>
      </footer>
      {modal && (
        <Modal
          type={modal}
          categories={categories}
          title={newTitle}
          body={newBody}
          description={newDescription}
          parent={newParent}
          setTitle={setNewTitle}
          setBody={setNewBody}
          setDescription={setNewDescription}
          setParent={setNewParent}
          onClose={() => setModal(null)}
          onSave={
            modal === "topic"
              ? createTopic
              : modal === "edit-topic"
                ? updateTopic
                : modal === "edit-reply"
                  ? updateReply
                  : createCategory
          }
        />
      )}
    </div>
  );
}

function TopicRow({
  topic,
  onClick,
}: {
  topic: ForumTopic;
  onClick: () => void;
}) {
  return (
    <button className="forum-topic-row" onClick={onClick}>
      <div className="forum-topic-icon">
        {topic.pinned ? (
          <Bell size={17} />
        ) : topic.locked ? (
          <Lock size={17} />
        ) : (
          <MessageCircle size={17} />
        )}
      </div>
      <div className="forum-topic-main">
        <div className="forum-topic-title">
          <h3>{topic.title}</h3>
          {topic.pinned && <span className="topic-badge">ЗАКРІПЛЕНО</span>}
          {topic.locked && (
            <span className="topic-badge muted-badge">ЗАКРИТО</span>
          )}
        </div>
        <p>{topic.excerpt}</p>
        <div className="forum-topic-tags">
          {topic.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>
      <div className="forum-topic-meta">
        <strong>{topic.replies}</strong>
        <small>відповідей</small>
      </div>
      <div className="forum-topic-meta">
        <strong>{topic.views}</strong>
        <small>переглядів</small>
      </div>
      <div className="forum-topic-last">
        <Avatar name={topic.lastAuthor} role={topic.authorRole} />
        <span>
          <strong>{topic.lastAuthor}</strong>
          <small>{topic.lastAt}</small>
        </span>
      </div>
      <ChevronRight className="forum-topic-arrow" size={18} />
    </button>
  );
}

function TopicView({
  topic,
  replies,
  user,
  body,
  setBody,
  onBack,
  onReply,
  onLogin,
  onModerate,
  onEditTopic,
  onDeleteTopic,
  onEditReply,
  onDeleteReply,
}: {
  topic: ForumTopic;
  replies: ForumReply[];
  user: ForumUser | null;
  body: string;
  setBody: (value: string) => void;
  onBack: () => void;
  onReply: () => void;
  onLogin: () => void;
  onModerate: (action: "lock" | "pin") => void;
  onEditTopic: () => void;
  onDeleteTopic: () => void;
  onEditReply: (reply: ForumReply) => void;
  onDeleteReply: (reply: ForumReply) => void;
}) {
  const topicEditable =
    !!user && (user.username === topic.author || canAdmin(user));
  return (
    <section className="forum-thread">
      <button className="forum-back" onClick={onBack}>
        <ArrowLeft size={16} /> НАЗАД ДО ТЕМ
      </button>
      <div className="forum-thread-head">
        <div>
          <div className="forum-topic-tags">
            {topic.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <h1>
            {topic.title}
            {topic.edited && <small className="edited-label"> · ред.</small>}
          </h1>
          <p>
            Створив <strong>{topic.author}</strong> · {topic.createdAt}
          </p>
        </div>
        <div className="forum-thread-actions">
          {topicEditable && (
            <>
              <button onClick={onEditTopic} title="Редагувати тему">
                <Edit3 size={17} />
              </button>
              <button onClick={onDeleteTopic} title="Видалити тему">
                <Trash2 size={17} />
              </button>
            </>
          )}
          {canModerate(user) && (
            <>
              <button onClick={() => onModerate("pin")} title="Закріпити">
                <Bell size={17} />
              </button>
              <button
                onClick={() => onModerate("lock")}
                title={topic.locked ? "Відкрити" : "Закрити"}
              >
                {topic.locked ? <Unlock size={17} /> : <Lock size={17} />}
              </button>
            </>
          )}
          <span>
            <Eye size={16} /> {topic.views}
          </span>
        </div>
      </div>
      <div className="forum-post forum-post-opening">
        <div className="forum-post-author">
          <Avatar name={topic.author} role={topic.authorRole} />
          <strong>{topic.author}</strong>
          <RoleBadge role={topic.authorRole} />
        </div>
        <div className="forum-post-body">
          <p>{topic.excerpt}</p>
          <small>
            Демонстраційна mock-тема PRIME RP. Після підключення бази контент
            зберігатиметься на сервері.
          </small>
        </div>
      </div>
      {replies.map((reply) => (
        <div className="forum-post" key={reply.id}>
          <div className="forum-post-author">
            <Avatar name={reply.author} role={reply.role} />
            <strong>{reply.author}</strong>
            <RoleBadge role={reply.role} />
            <span>{reply.createdAt}</span>
          </div>
          <div className="forum-post-body">
            <p>
              {reply.body}
              {reply.edited && (
                <small className="edited-label"> · відредаговано</small>
              )}
            </p>
            <div className="forum-post-actions">
              <button className="forum-like">
                <ThumbsUp size={14} /> {reply.likes}
              </button>
              {user && (user.username === reply.author || canAdmin(user)) && (
                <>
                  <button onClick={() => onEditReply(reply)} title="Редагувати">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDeleteReply(reply)} title="Видалити">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      <div className="forum-reply-box">
        {user && !topic.locked ? (
          <>
            <div className="forum-reply-heading">
              <span>ВАША ВІДПОВІДЬ</span>
              <RoleBadge role={user.role} />
            </div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Напишіть відповідь для спільноти..."
            />
            <button className="forum-create-btn" onClick={onReply}>
              <Send size={16} /> ОПУБЛІКУВАТИ
            </button>
          </>
        ) : topic.locked ? (
          <p>
            <Lock size={17} /> Цю тему закрито.{" "}
            {canModerate(user) && "Модератор може відкрити її кнопкою вище."}
          </p>
        ) : (
          <p>
            <LogIn size={17} /> Увійдіть, щоб долучитися.{" "}
            <button onClick={onLogin}>УВІЙТИ</button>
          </p>
        )}
      </div>
    </section>
  );
}

function AuthCard({
  mode,
  onSubmit,
  onSwitch,
  error,
  onBack,
}: {
  mode: "login" | "register";
  onSubmit: (login: string, password: string, email?: string) => void;
  onSwitch: () => void;
  error: string;
  onBack: () => void;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  return (
    <section className="forum-auth-wrap">
      <button className="forum-back" onClick={onBack}>
        <ArrowLeft size={16} /> ПОВЕРНУТИСЯ НА ФОРУМ
      </button>
      <div className="forum-auth-card">
        <div className="forum-auth-copy">
          <p className="forum-kicker">
            <span /> PRIME RP COMMUNITY
          </p>
          <h1>
            {mode === "login" ? (
              <>
                ПОВЕРНІТЬСЯ
                <br />
                <em>У СВІТ</em>
              </>
            ) : (
              <>
                СТВОРІТЬ
                <br />
                <em>АКАУНТ</em>
              </>
            )}
          </h1>
          <p>
            {mode === "login"
              ? "Увійдіть, щоб спілкуватися, створювати теми та редагувати власні матеріали."
              : "Створіть акаунт спільноти PRIME RP, щоб брати участь у форумі."}
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(login, password, email);
          }}
          className="forum-form"
        >
          {mode === "register" && (
            <label>
              EMAIL
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
          )}
          <label>
            ЛОГІН
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Введіть логін"
              required
            />
          </label>
          <label>
            ПАРОЛЬ
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введіть пароль"
              required
            />
          </label>
          {error && <div className="forum-form-error">{error}</div>}
          <button className="forum-submit" type="submit">
            {mode === "login" ? (
              <>
                <LogIn size={17} /> УВІЙТИ
              </>
            ) : (
              <>
                <UserPlus size={17} /> СТВОРИТИ АКАУНТ
              </>
            )}
          </button>
          <button className="forum-switch" type="button" onClick={onSwitch}>
            {mode === "login"
              ? "Немає акаунта? Зареєструватися"
              : "Вже маєте акаунт? Увійти"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Account({
  user,
  profile,
  setProfile,
  tab,
  setTab,
  categories,
  onSave,
  onBack,
  onLogout,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: {
  user: ForumUser;
  profile: ForumUser;
  setProfile: (value: ForumUser) => void;
  tab: "profile" | "manage";
  setTab: (value: "profile" | "manage") => void;
  categories: ForumCategory[];
  onSave: () => void;
  onBack: () => void;
  onLogout: () => void;
  onCreateCategory: () => void;
  onEditCategory: (item: ForumCategory) => void;
  onDeleteCategory: (item: ForumCategory) => void;
}) {
  return (
    <section className="forum-account-page">
      <div className="forum-dashboard-top">
        <button className="forum-back" onClick={onBack}>
          <ArrowLeft size={16} /> ДО ФОРУМУ
        </button>
        <button className="forum-logout" onClick={onLogout}>
          <LogOut size={16} /> ВИЙТИ
        </button>
      </div>
      <div className="forum-dashboard-heading">
        <div>
          <p className="forum-kicker">
            <span /> PERSONAL SPACE
          </p>
          <h1>
            КАБІНЕТ <em>{user.username}</em>
          </h1>
          <p>
            Роль: <RoleBadge role={user.role} />
          </p>
        </div>
        <Avatar name={user.username} role={user.role} />
      </div>
      <div className="forum-account-tabs">
        <button
          className={tab === "profile" ? "active" : ""}
          onClick={() => setTab("profile")}
        >
          <Settings size={16} /> МОЇ ДАНІ
        </button>
        {canAdmin(user) && (
          <button
            className={tab === "manage" ? "active" : ""}
            onClick={() => setTab("manage")}
          >
            <ShieldCheck size={16} /> КЕРУВАННЯ ФОРУМОМ
          </button>
        )}
      </div>
      {tab === "profile" ? (
        <div className="forum-profile-editor">
          <div>
            <span className="forum-kicker">
              <span /> PROFILE SETTINGS
            </span>
            <h2>ВАШ ПРОФІЛЬ</h2>
            <p>Дані зберігаються локально до підключення акаунтів PRIME RP.</p>
          </div>
          <div className="forum-profile-form">
            <label>
              НІКНЕЙМ
              <input
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
              />
            </label>
            <label>
              EMAIL
              <input
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </label>
            <label>
              МІСТО
              <input
                value={profile.city ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
              />
            </label>
            <label>
              DISCORD
              <input
                value={profile.discord ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, discord: e.target.value })
                }
              />
            </label>
            <label className="full">
              ПРО СЕБЕ
              <textarea
                value={profile.bio ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
              />
            </label>
            <button className="forum-submit" onClick={onSave}>
              ЗБЕРЕГТИ ЗМІНИ
            </button>
          </div>
        </div>
      ) : (
        <div className="forum-manage">
          <div className="forum-manage-head">
            <div>
              <span className="forum-kicker">
                <span /> ADMIN CMS
              </span>
              <h2>СТРУКТУРА ФОРУМУ</h2>
              <p>
                Створюйте розділи та підрозділи. Mock-дані готові до заміни API.
              </p>
            </div>
            <button className="forum-create-btn" onClick={onCreateCategory}>
              <Plus size={16} /> ДОДАТИ РОЗДІЛ
            </button>
          </div>
          <div className="forum-category-admin-list">
            {categories.map((item) => (
              <div key={item.id}>
                <span className="forum-category-admin-name">
                  {item.parentId ? "↳ " : ""}
                  {item.title}
                </span>
                <span>{item.description}</span>
                <button
                  title="Редагувати розділ"
                  onClick={() => onEditCategory(item)}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  title="Видалити розділ"
                  onClick={() => onDeleteCategory(item)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Modal({
  type,
  categories,
  title,
  body,
  description,
  parent,
  setTitle,
  setBody,
  setDescription,
  setParent,
  onClose,
  onSave,
}: {
  type: "topic" | "category" | "edit-topic" | "edit-reply";
  categories: ForumCategory[];
  title: string;
  body: string;
  description: string;
  parent: string;
  setTitle: (value: string) => void;
  setBody: (value: string) => void;
  setDescription: (value: string) => void;
  setParent: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const isCategory = type === "category";
  const isReply = type === "edit-reply";
  return (
    <div
      className="forum-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="forum-modal">
        <button
          className="forum-modal-close"
          onClick={onClose}
          aria-label="Закрити"
        >
          <X size={18} />
        </button>
        <p className="forum-kicker">
          <span /> {isCategory ? "ADMIN CMS" : "COMMUNITY CONTENT"}
        </p>
        <h2>
          {isCategory
            ? "НОВИЙ РОЗДІЛ"
            : isReply
              ? "РЕДАГУВАТИ ВІДПОВІДЬ"
              : type === "edit-topic"
                ? "РЕДАГУВАТИ ТЕМУ"
                : "СТВОРИТИ ТЕМУ"}
        </h2>
        {isCategory ? (
          <>
            <label>
              НАЗВА РОЗДІЛУ
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Наприклад, Ігрові події"
              />
            </label>
            <label>
              ОПИС
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Короткий опис розділу"
              />
            </label>
            <label>
              БАТЬКІВСЬКИЙ РОЗДІЛ
              <select
                value={parent}
                onChange={(e) => setParent(e.target.value)}
              >
                <option value="">Без батьківського розділу</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            {!isReply && (
              <label>
                НАЗВА ТЕМИ
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Зрозумілий заголовок"
                />
              </label>
            )}
            <label>
              {isReply ? "ТЕКСТ ВІДПОВІДІ" : "ОПИС ТЕМИ"}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ваш текст..."
              />
            </label>
          </>
        )}
        <button className="forum-submit" onClick={onSave}>
          {isCategory ? (
            <>
              <Plus size={16} /> СТВОРИТИ РОЗДІЛ
            </>
          ) : (
            <>
              <Send size={16} /> ЗБЕРЕГТИ
            </>
          )}
        </button>
      </div>
    </div>
  );
}
