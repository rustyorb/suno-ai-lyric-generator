import { useState, useEffect } from "react";

export interface LyricDraft {
  id: string;
  title: string;
  content: string;
  folder: string;
}

interface DraftLibraryProps {
  onSelectDraft: (draft: LyricDraft) => void;
  currentLyrics: string;
}

const DraftLibrary: React.FC<DraftLibraryProps> = ({ onSelectDraft, currentLyrics }) => {
  const [drafts, setDrafts] = useState<LyricDraft[]>([]);
  const [show, setShow] = useState(false);
  const [folder, setFolder] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(currentLyrics);

  useEffect(() => {
    setContent(currentLyrics);
  }, [currentLyrics]);

  useEffect(() => {
    const stored = localStorage.getItem("lyricDrafts");
    if (stored) {
      setDrafts(JSON.parse(stored));
    }
  }, []);

  const saveDrafts = (list: LyricDraft[]) => {
    setDrafts(list);
    localStorage.setItem("lyricDrafts", JSON.stringify(list));
  };

  const addDraft = () => {
    if (!content.trim()) return;
    const newDraft: LyricDraft = {
      id: Date.now().toString(),
      title: title || `Draft ${drafts.length + 1}`,
      content,
      folder: folder || "General",
    };
    const updated = [...drafts, newDraft];
    saveDrafts(updated);
    setTitle("");
    setContent("");
  };

  const removeDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    saveDrafts(updated);
  };

  return (
    <div className="mb-4">
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded mr-2"
        onClick={() => setShow(!show)}
      >
        {show ? "Hide Library" : "Show Library"}
      </button>
      {show && (
        <div className="bg-gray-800 p-4 rounded mt-2">
          <h3 className="text-purple-400 mb-2">Draft Library</h3>
          {drafts.length === 0 && <p className="text-gray-400">No drafts saved.</p>}
          {drafts.map((draft) => (
            <div key={draft.id} className="mb-2 p-2 bg-gray-700 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-purple-300">{draft.title}</p>
                  <p className="text-sm text-gray-400">Folder: {draft.folder}</p>
                </div>
                <div className="space-x-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                    onClick={() => onSelectDraft(draft)}
                  >
                    Open
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                    onClick={() => removeDraft(draft.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-4">
            <h4 className="text-purple-400 mb-2">Save Current Draft</h4>
            <input
              type="text"
              placeholder="Title"
              className="w-full mb-2 p-2 bg-gray-700 rounded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Folder"
              className="w-full mb-2 p-2 bg-gray-700 rounded"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
            <textarea
              placeholder="Lyrics"
              className="w-full mb-2 p-2 bg-gray-700 rounded"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded"
              onClick={addDraft}
            >
              Save Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftLibrary;
