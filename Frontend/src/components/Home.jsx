import { createSignal, createResource, For, Show } from "solid-js";
import axios, { spread } from "axios";
import toast, { Toaster } from "solid-toast";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

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
            },
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
        refetch();
    };

    const prevPage = () => {
        setOffset(Math.max(0, offset() - limit()));
        refetch();
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
            toast.success("Captured speech input!");
            setListening(false);
        };

        recognition.onerror = (event) => {
            toast.error("Speech recognition error: " + event.error);
            setListening(false);
        };

        recognition.onend = () => setListening(false);
    };

    return (
        <div class={darkMode() ? "dark bg-gray-900 text-white" : "bg-white text-black"}>
            <Toaster position="top-center" />
            <div class="max-w-3xl mx-auto px-4 py-6">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-4xl font-bold flex gap-2 items-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                        AI Tweet Generator
                    </h1>
                    <button
                        onClick={() => setDarkMode(!darkMode())}
                        class="p-2 rounded-full border hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        {darkMode() ? (
                            //  Moon Icon (Dark Mode Active)
                            <span>
                                🌙
                            </span>
                        ) : (
                            //  Sun Icon (Light Mode Active)
                            <span>
                                ☀️
                            </span>
                        )}
                    </button>

                </div>

                <div class="bg-white dark:bg-gray-800/60 p-6 rounded-xl shadow-lg mb-6">
                    <div class="relative mb-4">
                        <input value={topic()} onInput={(e) => setTopic(e.currentTarget.value)} placeholder="Speak or type your topic..."
                            class="w-full p-3 border rounded-xl ring-1 ring-gray-200 shadow-inner bg-white text-black dark:bg-gray-700 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 pr-12" />
                        <button
                            onClick={startSpeechToText}
                            class={`absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-2 rounded-full transition text-white shadow-md 
    ${listening() ? "bg-red-600 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700"}`}
                        >
                            {listening() ? (
                                // Listening Mic Icon
                                <span>
                                    🔴
                                </span>
                            ) : (
                                <span>
                                    🎙️
                                </span>

                            )}
                        </button>

                    </div>

                    <button onClick={generateTweet} disabled={loading()} class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-full shadow-md hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition duration-300">
                        {loading() && <svg class='animate-spin h-5 w-5 text-white' viewBox='0 0 24 24'><circle class='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' stroke-width='4'></circle><path class='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'></path></svg>}
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                        {loading() ? "Generating..." : "Generate Tweet"}
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <input id="search" value={search()} onInput={(e) => { setSearch(e.currentTarget.value); setOffset(0); refetch(); }} class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Search by topic..." />
                    <select
                        onChange={(e) => {
                            const value = e.currentTarget.value;
                            if (value === "true") setPosted(true);
                            else if (value === "false") setPosted(false);
                            else setPosted(null);
                            setOffset(0);
                            refetch();
                        }}
                        class="w-full appearance-none p-3 border rounded-lg bg-white text-black dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500
         bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%23ffffff%27 stroke-width=%272%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 d=%27M19 9l-7 7-7-7%27 /%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1em_1em]"
                    >
                        <option value="null">All</option>
                        <option value="true">Posted</option>
                        <option value="false">Unposted</option>
                    </select>

                </div>

                <Show when={tweetList()?.items?.length > 0} 
                fallback={
                   <Show
                   when={!tweetList.loading}
                   fallback={
                    <div class="space-y-4">
      <For each={Array.from({ length: 3 })}>
        {() => (
          <div class="animate-pulse bg-white/30 dark:bg-gray-800/50 p-5 rounded-2xl shadow-md mb-5 border dark:border-gray-700">
            <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
            <div class="flex gap-3 mt-3">
              <div class="h-8 w-24 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              <div class="h-8 w-20 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            </div>
          </div>
        )}
      </For>
    </div>
                   }
                   >


                   </Show>


                    }>
                    <For each={tweetList()?.items}>
                        {(tweet) => (
                            <div class="group bg-white/30 dark:bg-gray-800/50 p-5 rounded-2xl shadow-md mb-5 border dark:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] hover:border-indigo-300 dark:hover:border-indigo-500">
                                <Show
                                    when={editId() === tweet.id}
                                    fallback={
                                        <>
                                            <p class="text-lg dark:text-white">{tweet.content}</p>
                                            <div class="text-sm italic mt-2 text-gray-500 dark:text-gray-300 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2 5a2 2 0 012-2h3.5a1.5 1.5 0 010 3H4v10h12V9.5a1.5 1.5 0 113 0V16a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                                                </svg>
                                                Topic: <span class="font-medium text-indigo-300 dark:text-indigo-800">{tweet.topic}</span>
                                            </div>

                                        </>
                                    }
                                >
                                    <textarea
                                        class="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white mb-2 focus:ring-2 focus:ring-indigo-500"
                                        value={editContent()}
                                        onInput={(e) => setEditContent(e.currentTarget.value)}
                                    />
                                    <input
                                        class="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white mb-2 focus:ring-2 focus:ring-indigo-500"
                                        value={editTopic()}
                                        onInput={(e) => setEditTopic(e.currentTarget.value)}
                                    />
                                </Show>

                                <div class="mt-3 flex gap-3 flex-wrap">
                                    <button
                                        onClick={() => postTweet(tweet.id)}
                                        disabled={tweet.posted}
                                        class={`px-5 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${tweet.posted
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-700 text-white"
                                            }`}
                                    >
                                        {tweet.posted ? "Posted" : "Post to Twitter"}
                                    </button>

                                    <Show
                                        when={editId() === tweet.id}
                                        fallback={
                                            <Show when={!tweet.posted}>
                                                <button
                                                    onClick={() => startEdit(tweet)}
                                                    class="px-4 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-transform duration-200 hover:scale-105"
                                                >
                                                    ✏️ Edit
                                                </button>
                                            </Show>
                                        }
                                    >
                                        <button
                                            onClick={() => saveEdit(tweet.id)}
                                            class="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-transform duration-200 hover:scale-105"
                                        >
                                            💾 Save
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            class="px-4 py-2 rounded-full bg-gray-500 hover:bg-gray-600 text-white font-medium transition-transform duration-200 hover:scale-105"
                                        >
                                            ❌ Cancel
                                        </button>
                                    </Show>
                                </div>
                            </div>

                        )}
                    </For>

                    <div class="flex justify-between items-center mt-6 gap-3">
                        <button onClick={prevPage} disabled={offset() === 0} class="px-5 py-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition">Previous</button>
                        <span class="text-sm text-gray-600 dark:text-gray-400">Page {tweetList()?.current_page || 1} of {tweetList()?.total_pages || 1}</span>
                        <button onClick={nextPage} disabled={tweetList()?.items?.length < limit()} class="px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">Next</button>
                    </div>
                </Show>
            </div>
        </div>
    );
}

export default Home;
