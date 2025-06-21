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

    const [limit] = createSignal(10);
    const [offset, setOffset] = createSignal(0);
    const [posted, setPosted] = createSignal(null);
    const [listening, setListening] = createSignal(false);


    const fetchTweets = async () => {
        const res = await axios.get(`${BACKEND}/tweet/tweets`, {
            params: {
                limit: limit(),
                offset: offset(),
                search: search(),
                posted: posted() !== null ? posted() : undefined,
            }
        });
        return res.data;
    };

    const [tweetList, { refetch }] = createResource([search, offset], fetchTweets);

    const generateTweet = async () => {
        if (!topic()) return;
        try {
            setLoading(true);
            await axios.post(`${BACKEND}/tweet/generate-tweet`, { topic: topic() });
            toast.success("Tweet generated!");
            setTopic("");
            setOffset(0);
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

    const nextPage = () => {
        if (tweetList()?.items?.length >= limit()) {
            setOffset(offset() + limit());
        }
        refetch()
    };

    const prevPage = () => {
        setOffset(Math.max(0, offset() - limit()));
        refetch()
    };
    const startSpeechToText = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    toast.error("Speech recognition is not supported in your browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  setListening(true);
  recognition.start();

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    setTopic(speechResult);
    toast.success("🗣️ Captured speech input!");
    setListening(false);
  };

  recognition.onerror = (event) => {
    toast.error("Speech recognition error: " + event.error);
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
  };
};


    return (
        <div class={darkMode()
            ? "dark bg-gradient-to-b from-gray-900 to-black text-white min-h-screen transition"
            : "bg-gradient-to-b from-blue-50 to-white text-black min-h-screen transition"}
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

                <div class="bg-white dark:bg-gray-800/60 p-6 rounded-xl shadow-lg transition mb-6">
                    <div class="relative mb-4">
                        <input
                            value={topic()}
                            onInput={(e) => setTopic(e.currentTarget.value)}
                            placeholder="🎙️ Speak or type your topic..."
                            class="w-full p-3 border rounded-lg shadow-sm bg-white text-black dark:bg-gray-700 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 transition pr-12"
                        />
                        <button
                            onClick={startSpeechToText}
                            class={`absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded transition
    ${listening() ? "bg-red-600 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700"}
    text-white`}
                        >
                            {listening() ? "🎙️ Listening..." : "🎤"}
                        </button>

                    </div>

                    <button
                        onClick={generateTweet}
                        disabled={loading()}
                        class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                    >
                        {loading() ? "⏳ Generating..." : "✨ Generate Tweet"}
                    </button>
                </div>


                <div class="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
  {/* Search Input */}
  <div>
    <label for="search" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      🔍 Search by Topic
    </label>
    <input
      id="search"
      value={search()}
      onInput={(e) => {
        setSearch(e.currentTarget.value);
        setOffset(0);
        refetch();
      }}
      class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
      placeholder="Enter keyword like AI, React, etc."
    />
  </div>

  {/* Filter by Post Status */}
  <div>
    <label for="filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      🧵 Filter by Status
    </label>
    <select
      id="filter"
      onChange={(e) => {
        const value = e.currentTarget.value;
        if (value === "true") setPosted(true);
        else if (value === "false") setPosted(false);
        else setPosted(null);
        setOffset(0);
        refetch();
      }}
      class="w-full p-3 border rounded-lg  dark:border-gray-600 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all  placeholder:text-gray-400 dark:placeholder:text-gray-300 "
    >
      <option value="null">All</option>
      <option value="true">✅ Posted</option>
      <option value="false">🕓 Unposted</option>
    </select>
  </div>
</div>


                <h2 class="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-300">
                    📝 Generated Tweets
                </h2>

                <Show when={tweetList()?.items?.length > 0} fallback={<p class="text-gray-500">No tweets found.</p>}>
                    <For each={tweetList()?.items}>
                        {(tweet) => (
                            <div class="bg-white/80 dark:bg-gray-800/60 p-5 rounded-xl shadow-md mb-4 hover:scale-[1.01] transition-all">
                                <Show
                                    when={editId() === tweet.id}
                                    fallback={
                                        <>
                                            <p class="text-lg text-black dark:text-white">{tweet.content}</p>
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

                    <div class="flex justify-between items-center mt-6">
                        <button
                            onClick={prevPage}
                            disabled={offset() === 0}
                            class="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 disabled:opacity-50"
                        >
                            ◀️ Previous
                        </button>
                        <button
                            onClick={nextPage}
                            disabled={tweetList()?.items?.length < limit()}
                            class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                        >
                            Next ▶️
                        </button>
                    </div>

                    <div class="text-center text-sm mt-2 text-gray-500 dark:text-gray-400">
                        Page {tweetList()?.current_page} of {tweetList()?.total_pages}
                    </div>
                </Show>
            </div>
        </div>
    );
}

export default Home;
