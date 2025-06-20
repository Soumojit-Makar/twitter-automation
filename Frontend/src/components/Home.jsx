import { createSignal, createResource, For, Show } from "solid-js";
import axios from "axios";
import toast, { Toaster } from "solid-toast";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

function Home() {
    const [topic, setTopic] = createSignal("");
    const [search, setSearch] = createSignal("");
    const [darkMode, setDarkMode] = createSignal(false);
    const [loading, setLoading] = createSignal(false);

    const [editId, setEditId] = createSignal(null);
    const [editTopic, setEditTopic] = createSignal("");
    const [editContent, setEditContent] = createSignal("");

    const fetchTweets = async () => {
        const res = await axios.get(`${BACKEND}/tweet/tweets`);
        return res.data;
    };

    const [tweetList, { refetch }] = createResource(fetchTweets);

    const generateTweet = async () => {
        if (!topic()) return;
        try {
            setLoading(true);
            await axios.post(`${BACKEND}/tweet/generate-tweet`, { topic: topic() });
            toast.success("Tweet generated!");
            setTopic("");
            refetch();
        } catch {
            toast.error("Failed to generate tweet.");
        } finally {
            setLoading(false);
        }
    };

    const postTweet = async (id) => {
        try {
            await axios.post(`${BACKEND}/tweet/post-tweet/${id}`, {});
            toast.success("Tweet posted!");
            refetch();
        } catch {
            toast.error("Failed to post tweet.");
        }
    };

    const startEdit = (tweet) => {
        setEditId(tweet.id);
        setEditTopic(tweet.topic);
        setEditContent(tweet.content);
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditTopic("");
        setEditContent("");
    };

    const saveEdit = async (id) => {
        try {
            await axios.put(`${BACKEND}/tweet/edit/${id}`, {
                topic: editTopic(),
                content: editContent(),
            });
            toast.success("Tweet updated!");
            cancelEdit();
            refetch();
        } catch {
            toast.error("Failed to update tweet.");
        }
    };

    const filteredTweets = () =>
        tweetList()?.filter((t) =>
            t.topic.toLowerCase().includes(search().toLowerCase())
        );

    return (
        <div
            class={
                darkMode()
                    ? "dark bg-gradient-to-b from-gray-900 to-black text-white min-h-screen transition"
                    : "bg-gradient-to-b from-blue-50 to-white text-black min-h-screen transition"
            }
        >
            <Toaster position="top-center" gutter={12} />

            <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-4xl font-extrabold flex items-center gap-2">
                        <span class="text-indigo-600 dark:text-pink-400 transition">🤖</span>
                        <span class="bg-gradient-to-r from-indigo-500 to-pink-500 text-transparent bg-clip-text">
                            AI Tweet Generator
                        </span>
                    </h1>
                    <button
                        onClick={() => setDarkMode(!darkMode())}
                        class="px-3 py-1 text-sm rounded border transition hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        {darkMode() ? "☀️ Light" : "🌙 Dark"}
                    </button>
                </div>

                <div class="bg-white dark:bg-gray-800/60 backdrop-blur-md p-6 rounded-xl shadow-lg transition mb-6">
                    <input
                        value={topic()}
                        onInput={(e) => setTopic(e.currentTarget.value)}
                        placeholder="💬 Enter a topic like 'React', 'AI', etc."
                        class="w-full p-3 mb-4 border border-gray-300 rounded-lg shadow-sm 
              bg-white text-black 
              dark:bg-gray-700 dark:text-white dark:border-gray-600 
              placeholder:text-gray-500 dark:placeholder:text-gray-400 
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              transition"
                    />
                    <button
                        onClick={generateTweet}
                        disabled={loading()}
                        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                    >
                        {loading() ? "⏳ Generating..." : "✨ Generate Tweet"}
                    </button>
                </div>

                <input
                    value={search()}
                    onInput={(e) => setSearch(e.currentTarget.value)}
                    class="w-full p-3 mb-6 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="🔍 Search tweets by topic"
                />

                <h2 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-300">
                    📝 Generated Tweets
                </h2>
                <For each={filteredTweets()}>
                    {(tweet) => (
                        <div class="bg-white/80 dark:bg-gray-800/60 backdrop-blur-md p-5 rounded-xl shadow-md mb-4 hover:scale-[1.01] transition-all">
                            <Show
                                when={editId() === tweet.id}
                                fallback={
                                    <>
                                        <p class="text-lg text-black dark:text-white">
                                            {tweet.content}
                                        </p>
                                        <div class="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">
                                            Topic: {tweet.topic}
                                        </div>
                                    </>
                                }
                            >
                                <textarea
                                    class="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white mb-2"
                                    value={editContent()}
                                    onInput={(e) => setEditContent(e.currentTarget.value)}
                                />
                                <input
                                    class="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white mb-2"
                                    value={editTopic()}
                                    onInput={(e) => setEditTopic(e.currentTarget.value)}
                                />
                            </Show>

                            <div class="mt-2 flex gap-3 flex-wrap">
                                <button
                                    onClick={() => postTweet(tweet.id)}
                                    disabled={tweet.posted}
                                    class={`px-4 py-2 rounded text-white ${tweet.posted
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-700"
                                        } transition-all`}
                                >
                                    {tweet.posted ? "✅ Posted" : "🚀 Post to Twitter"}
                                </button>

                                <Show
                                    when={editId() === tweet.id}
                                    fallback={
                                        <Show when={!tweet.posted}>
                                            <button
                                                onClick={() => startEdit(tweet)}
                                                class="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 transition"
                                            >
                                                ✏️ Edit
                                            </button>
                                        </Show>
                                    }
                                >
                                    <button
                                        onClick={() => saveEdit(tweet.id)}
                                        class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                                    >
                                        💾 Save
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        class="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition"
                                    >
                                        ❌ Cancel
                                    </button>
                                </Show>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}

export default Home;
