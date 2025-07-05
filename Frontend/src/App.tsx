import { createSignal, createResource, For, Show, JSX } from "solid-js";
import toast, { Toaster } from "solid-toast";
import { mockBackend } from "./services/mockBackend";

function App() {
    const [topic, setTopic] = createSignal("");
    const [search, setSearch] = createSignal("");
    const [darkMode, setDarkMode] = createSignal(false);
    const [loading, setLoading] = createSignal(false);

    const [editId, setEditId] = createSignal(null);
    const [editTopic, setEditTopic] = createSignal("");
    const [editContent, setEditContent] = createSignal("");

    const [limit] = createSignal(3);
    const [offset, setOffset] = createSignal(0);
    const [posted, setPosted] = createSignal<boolean|undefined>(undefined);
    const [listening, setListening] = createSignal<Boolean>(false);

    const fetchTweets = async () => {
        const response = await mockBackend.getTweets({
            limit: limit(),
            offset: offset(),
            search: search(),
            posted: posted() !== null ? posted() : undefined,
        });
        return response;
    };

    const [tweetList, { refetch }] = createResource([search, offset], fetchTweets);

    const generateTweet = async () => {
        if (!topic()) return;
        try {
            setLoading(true);
            await mockBackend.generateTweet(topic());
            toast.success("✨ Tweet generated successfully!", {
                style: {
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    fontWeight: '600',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                } as JSX.CSSProperties
            });
            setTopic("");
            setOffset(0);
            refetch();
        } catch {
            toast.error("❌ Failed to generate tweet", {
                style: {
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    fontWeight: '600',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                } as JSX.CSSProperties
            });
        } finally {
            setLoading(false);
        }
    };

    const postTweet = async (id: number) => {
        try {
            await mockBackend.postTweet(id);
            toast.success("🚀 Tweet posted to Twitter!", {
                style: {
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    fontWeight: '600'
                } as JSX.CSSProperties
            });
            refetch();
        } catch {
            toast.error("Failed to post tweet");
        }
    };

    const startEdit = (tweet: any) => {
        setEditId(tweet.id);
        setEditTopic(tweet.topic);
        setEditContent(tweet.content);
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditTopic("");
        setEditContent("");
    };

    const saveEdit = async (id: number) => {
        try {
            await mockBackend.editTweet(id, {
                topic: editTopic(),
                content: editContent(),
            });
            toast.success("💾 Tweet updated successfully!");
            cancelEdit();
            refetch();
        } catch {
            toast.error("Failed to update tweet");
        }
    };

    const nextPage = () => {
        const itemsLength = tweetList()?.items?.length ?? 0; 
        if (itemsLength >= limit()) {
            setOffset(offset() + limit());
        }
        refetch();
    };


    const prevPage = () => {
        setOffset(Math.max(0, offset() - limit()));
        refetch();
    };

    const startSpeechToText = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    toast.error("Speech recognition not supported");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  setListening(true);
  recognition.start();

  recognition.onresult = (event: any) => {
    const speechResult = event.results[0][0].transcript;
    setTopic(speechResult);
    toast.success("🎤 Speech captured!");
    setListening(false);
  };

  recognition.onerror = (event:any) => {
    toast.error("Speech recognition error: " + event.error);
    setListening(false);
  };

  recognition.onend = () => setListening(false);
};


    return (
        <div class={`min-h-screen transition-all duration-500 h-full ${darkMode()
            ? "dark bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
            : "bg-gradient-to-br from-indigo-50 via-white to-purple-50"
            }`}>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: '16px',
                        fontWeight: '600'
                    } as JSX.CSSProperties
                }}
            />

            {/* Background decorative elements */}
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div class="absolute top-40 left-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
            </div>

            <div class="relative max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div class="flex justify-between items-center mb-12">
                    <div class="flex items-center gap-4">
                        <div class="relative">
                            <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                               <svg
  class="w-6 h-6 text-white"
  fill="none"
  stroke="currentColor"
  attr:stroke-width="2"
  viewBox="0 0 24 24"
>
  <path
    attr:stroke-linecap="round"
    attr:stroke-linejoin="round"
    d="M13 10V3L4 14h7v7l9-11h-7z"
  />
</svg>

                            </div>
                            <div class="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-25 animate-pulse"></div>
                        </div>
                        <div>
                            <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                AI Tweet Generator
                            </h1>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Create engaging tweets with artificial intelligence
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setDarkMode(!darkMode())}
                        class="relative group p-3 rounded-2xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <div class="relative z-10">
                            {darkMode() ? (
                                <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
                                </svg>
                            ) : (
                                <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </div>
                        <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </button>
                </div>

                {/* Tweet Generation Card */}
                <div class="card-premium rounded-3xl p-8 mb-8 relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-400/10 dark:to-indigo-400/10"></div>
                    <div class="relative z-10">
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                            <div class="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            Create New Tweet
                        </h2>

                        <div class="relative mb-6">
                            <input
                                value={topic()}
                                onInput={(e) => setTopic(e.currentTarget.value)}
                                placeholder="Speak or type your topic..."
                                class="w-full p-4 pr-16 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 text-lg"
                            />
                            <button
                                onClick={startSpeechToText}
                                class={`absolute right-3 top-1/2 transform -translate-y-1/2 p-3 rounded-xl transition-all duration-300 ${listening()
                                    ? "bg-red-500 shadow-lg shadow-red-500/30 animate-pulse"
                                    : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg hover:shadow-xl hover:shadow-purple-500/30"
                                    }`}
                            >
                                {listening() ? (
                                    <div class="relative">
                                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
                                        </svg>
                                        <div class="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-75"></div>
                                    </div>
                                ) : (
                                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={generateTweet}
                            disabled={loading() || !topic().trim()}
                            class="btn-premium w-full flex items-center justify-center gap-3 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-lg"
                        >
                            {loading() ? (
                                <>
                                    <div class="spinner w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                                    <span>Generating Magic...</span>
                                </>
                            ) : (
                                <>
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>Generate Tweet</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div class="relative">
                        <input
                            value={search()}
                            onInput={(e) => { setSearch(e.currentTarget.value); setOffset(0); refetch(); }}
                            class="w-full p-4 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                            placeholder="Search tweets by topic..."
                        />
                        <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div class="relative">
                        <select
                            onChange={(e) => {
                                const value = e.currentTarget.value;
                                if (value === "true") setPosted(true);
                                else if (value === "false") setPosted(false);
                                else setPosted(undefined);
                                setOffset(0);
                                refetch();
                            }}
                            class="w-full appearance-none p-4 pl-12 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 cursor-pointer"
                        >
                            <option value="">All Tweets</option>
                            <option value="true">Posted</option>
                            <option value="false">Unposted</option>
                        </select>
                        <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                        </svg>
                        <svg class="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Tweet List */}
                <Show
                    when={(tweetList()?.items?.length??0) > 0}
                    fallback={
                        <Show
                            when={!tweetList.loading}
                            fallback={
                                <div class="space-y-6">
                                    <For each={Array.from({ length: 3 })}>
                                        {() => (
                                            <div class="card-premium animate-pulse rounded-3xl p-6">
                                                <div class="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl w-3/4 mb-4"></div>
                                                <div class="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-1/2 mb-6"></div>
                                                <div class="flex gap-3">
                                                    <div class="h-10 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full"></div>
                                                    <div class="h-10 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full"></div>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            }
                        >
                            <div class="card-premium rounded-3xl p-12 text-center">
                                <div class="w-24 h-24 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">No tweets yet</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-lg">Generate your first tweet to get started!</p>
                            </div>
                        </Show>
                    }
                >
                    <div class="space-y-6">
                        <For each={tweetList()?.items}>
                            {(tweet) => (
                                <div class="group card-premium rounded-3xl p-6 relative overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-400/10 dark:to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div class="relative z-10">
                                        <Show
                                            when={editId() === tweet.id}
                                            fallback={
                                                <>
                                                    <p class="text-lg leading-relaxed text-gray-800 dark:text-white mb-4 font-medium">{tweet.content}</p>
                                                    <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                                        <div class="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                                            <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            
                                                            <span class="font-medium text-purple-700 dark:text-purple-300">{tweet.topic}</span>

                                                        </div>
                                                        {tweet.posted && (
                                                            <div class="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                                                                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                                                </svg>
                                                                <span class="font-medium text-green-700 dark:text-green-300">Posted</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            }
                                        >
                                            <div class="space-y-4 mb-6">
                                                <textarea
                                                    class="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                                                    rows="4"
                                                    value={editContent()}
                                                    onInput={(e) => setEditContent(e.currentTarget.value)}
                                                    placeholder="Edit tweet content..."
                                                />
                                                <input
                                                    class="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl text-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                                                    value={editTopic()}
                                                    onInput={(e) => setEditTopic(e.currentTarget.value)}
                                                    placeholder="Edit topic..."
                                                />
                                                { tweet.image_path && (
                                                    <img src={mockBackend.getImage(tweet.id)} alt="" class="w-full h-auto rounded-2xl" />
                                                )}
                                            </div>
                                        </Show>

                                        <div class="flex gap-3 flex-wrap">
                                            { tweet.image_path && (
                                                <button
                                                    onClick={() => mockBackend.deleteImage(tweet.id)}
                                                    class="text-red-500 hover:underline"
                                                >
                                                    Delete Image
                                                </button>
                                                )}
                                                
                                            <button
                                                onClick={() => postTweet(tweet.id)}
                                                disabled={tweet.posted}
                                                class={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${tweet.posted
                                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/30"
                                                    }`}
                                            >
                                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                {tweet.posted ? "Posted" : "Post Tweet"}
                                            </button>

                                            <Show
                                                when={editId() === tweet.id}
                                                fallback={
                                                    <Show when={!tweet.posted}>
                                                        <button
                                                            onClick={() => startEdit(tweet)}
                                                            class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-amber-500/30"
                                                        >
                                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        {tweet.image_path && (
                            <button onClick={() =>{ 
                                                            mockBackend.imageGenerate(tweet.id) ;
                                                            refetch();

                                                        }}
                                                        class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-blue-500/30"
                                                        disabled={tweet.image_path !== null}
                                                        >
                                                            Generate Image
                                                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </Show>
                                            }
                                        >
                                                <button
                                                    onClick={() => saveEdit(tweet.id)}
                                                    class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-blue-500/30"
                                                >
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                                >
                                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Cancel
                                                </button>
                                            </Show>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </For>

                        {/* Pagination */}
                        <div class="flex justify-between items-center pt-8">
                            <button
                                onClick={prevPage}
                                disabled={offset() === 0}
                                class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>

                            <div class="flex items-center gap-4 px-6 py-3 bg-white/20 dark:bg-gray-800/30 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-700/30">
                                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Page {tweetList()?.current_page || 1} of {tweetList()?.total_pages || 1}
                                </span>
                            </div>

                            <button
                                onClick={nextPage}
                                disabled={(tweetList()?.items?.length ??0)< limit()}
                                class="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-blue-500/30"
                            >
                                Next
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}

export default App;