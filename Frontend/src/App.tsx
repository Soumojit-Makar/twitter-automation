import { createSignal, createResource, For, Show } from "solid-js";
import toast, { Toaster } from "solid-toast";
import { mockBackend } from "./services/mockBackend";

function App() {
  const [topic, setTopic] = createSignal("");
  const [search, setSearch] = createSignal("");
  const [darkMode, setDarkMode] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [editId, setEditId] = createSignal<string | null>(null);
  const [editTopic, setEditTopic] = createSignal("");
  const [editContent, setEditContent] = createSignal("");
  const [limit] = createSignal(10);
  const [offset, setOffset] = createSignal(0);
  const [posted, setPosted] = createSignal<boolean | null>(null);
  const [listening, setListening] = createSignal(false);

  const fetchTweets = async () => {
    const response = await mockBackend.getTweets({
      limit: limit(),
      offset: offset(),
      search: search(),
      posted: posted() !== null ? posted()! : undefined,
    });
    return response;
  };

  const [tweetList, { refetch }] = createResource([search, offset], fetchTweets);

  const generateTweet = async () => {
    if (!topic().trim()) return;
    try {
      setLoading(true);
      await mockBackend.generateTweet(topic());
      toast.success("✨ Tweet generated successfully!");
      setTopic("");
      setOffset(0);
      refetch();
    } catch {
      toast.error("❌ Failed to generate tweet");
    } finally {
      setLoading(false);
    }
  };

  const postTweet = async (id: string) => {
    try {
      await mockBackend.postTweet(id);
      toast.success("🚀 Tweet posted to Twitter!");
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

  const saveEdit = async (id: string) => {
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
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
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

    recognition.onerror = (event: any) => {
      toast.error("Speech recognition error: " + event.error);
      setListening(false);
    };

    recognition.onend = () => setListening(false);
  };

  return (
    <div class={darkMode() ? "dark bg-gray-900 text-white min-h-screen" : "bg-white text-black min-h-screen"}>
      <Toaster position="top-center" />
      <div class="p-6 max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold">AI Tweet Generator</h1>
          <button
            onClick={() => setDarkMode(!darkMode())}
            class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {darkMode() ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <div class="mb-4">
          <input
            value={topic()}
            onInput={(e) => setTopic(e.currentTarget.value)}
            placeholder="Type or speak your topic..."
            class="p-3 w-full border rounded mb-2"
          />
          <div class="flex gap-2">
            <button
              onClick={generateTweet}
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              disabled={loading()}
            >
              {loading() ? "Generating..." : "Generate Tweet"}
            </button>
            <button
              onClick={startSpeechToText}
              class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              {listening() ? "🎤 Listening..." : "🎤 Speak"}
            </button>
          </div>
        </div>

        <div class="mb-4">
          <input
            value={search()}
            onInput={(e) => {
              setSearch(e.currentTarget.value);
              setOffset(0);
              refetch();
            }}
            placeholder="Search by topic..."
            class="p-3 w-full border rounded"
          />
        </div>

        <div class="mb-4">
          <select
            onChange={(e) => {
              const val = e.currentTarget.value;
              setPosted(val === "all" ? null : val === "true");
              setOffset(0);
              refetch();
            }}
            class="p-2 border rounded w-full"
          >
            <option value="all">All Tweets</option>
            <option value="true">Posted</option>
            <option value="false">Unposted</option>
          </select>
        </div>

        <Show when={tweetList.loading}>
          <p>Loading tweets...</p>
        </Show>

        <Show when={tweetList()?.items?.length}>
          <For each={tweetList()?.items}>
            {(tweet) => (
              <div class="border rounded p-4 mb-4">
                <Show when={editId() === tweet.id} fallback={
                  <>
                    <h3 class="font-bold">{tweet.topic}</h3>
                    <p class="mb-2">{tweet.content}</p>
                  </>
                }>
                  <input
                    value={editTopic()}
                    onInput={(e) => setEditTopic(e.currentTarget.value)}
                    class="mb-2 p-2 w-full border rounded"
                  />
                  <textarea
                    value={editContent()}
                    onInput={(e) => setEditContent(e.currentTarget.value)}
                    class="mb-2 p-2 w-full border rounded"
                  />
                </Show>
                <div class="flex gap-2">
                  <Show when={editId() === tweet.id} fallback={
                    <>
                      <button
                        onClick={() => postTweet(tweet.id)}
                        disabled={tweet.posted}
                        class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {tweet.posted ? "Posted" : "Post"}
                      </button>
                      {!tweet.posted && (
                        <button
                          onClick={() => startEdit(tweet)}
                          class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  }>
                    <button
                      onClick={() => saveEdit(tweet.id)}
                      class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      class="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
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
              class="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {tweetList()?.current_page || 1}</span>
            <button
              onClick={nextPage}
              disabled={tweetList()?.items?.length < limit()}
              class="px-4 py-2 bg-gray-400 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </Show>

        <Show when={!tweetList.loading && tweetList()?.items?.length === 0}>
          <p class="text-center mt-6">No tweets found. Generate one!</p>
        </Show>
      </div>
    </div>
  );
}

export default App;
