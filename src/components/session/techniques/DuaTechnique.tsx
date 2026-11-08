/**
 * Technique 3: Dua & Contemplative Prayer.
 * Clean, customizable spiritual intention and knowledge prayer interface.
 */

import React, { useState } from 'react';
import { BookOpen, Check, Plus, Trash2 } from 'lucide-react';

interface DuaItem {
  id: string;
  title: string;
  arabic?: string;
  transliteration?: string;
  translation: string;
}

const DEFAULT_DUAS: DuaItem[] = [
  {
    id: 'dua_1',
    title: 'Supplication for Increase in Knowledge',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: "Rabbi zidni 'ilma",
    translation: 'My Lord, increase me in knowledge. (Surah Taha 20:114)',
  },
  {
    id: 'dua_2',
    title: 'Supplication for Ease in Difficult Tasks',
    arabic: 'اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً',
    transliteration: "Allahumma la sahla illa ma ja'altahu sahla, wa anta taj'alul hazna idha shi'ta sahla.",
    translation: 'O Allah, there is no ease except that which You make easy, and indeed You make the difficulty easy when You wish.',
  },
  {
    id: 'dua_3',
    title: 'Supplication for Mental Clarity and Speech',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي يَفْقَهُوا قَوْلِي',
    transliteration: "Rabbish-rah li sadri, wa yassir li amri, wahlul 'uqdatan min lisani, yafqahu qawli.",
    translation: 'My Lord, expand for me my chest with assurance, and ease for me my task, and untie the knot from my tongue that they may understand my speech. (Surah Taha 20:25-28)',
  },
];

interface DuaTechniqueProps {
  onComplete: () => void;
}

export const DuaTechnique: React.FC<DuaTechniqueProps> = ({ onComplete }) => {
  const [duas, setDuas] = useState<DuaItem[]>(DEFAULT_DUAS);
  const [activeDuaIndex, setActiveDuaIndex] = useState<number>(0);
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customTransliteration, setCustomTransliteration] = useState('');
  const [customTranslation, setCustomTranslation] = useState('');

  const activeDua = duas[activeDuaIndex] || duas[0];

  const handleAddCustomDua = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customTranslation.trim()) return;

    const newDua: DuaItem = {
      id: `dua_custom_${Date.now()}`,
      title: customTitle.trim(),
      arabic: customArabic.trim() || undefined,
      transliteration: customTransliteration.trim() || undefined,
      translation: customTranslation.trim(),
    };

    setDuas(prev => [...prev, newDua]);
    setActiveDuaIndex(duas.length);
    setIsAddingCustom(false);
    setCustomTitle('');
    setCustomArabic('');
    setCustomTransliteration('');
    setCustomTranslation('');
  };

  const handleDeleteCustom = (id: string) => {
    setDuas(prev => prev.filter(d => d.id !== id));
    setActiveDuaIndex(0);
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#18191C] border border-[#E5E5DF] dark:border-[#26282B] rounded-2xl p-6 md:p-10 max-w-2xl mx-auto space-y-6 shadow-xs">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-[#2D5A46]/10 text-[#2D5A46] dark:text-[#4E9473] flex items-center justify-center mx-auto">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
          Dua & Contemplative Intention
        </h3>
        <p className="text-xs text-[#717376] dark:text-[#9A9CA0] max-w-md mx-auto">
          Center your heart, seek clarity and beneficial knowledge before you open your books.
        </p>
      </div>

      {/* Supplication Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[#EAEAE4] dark:border-[#26282B] pb-3">
        {duas.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveDuaIndex(idx);
              setIsAddingCustom(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !isAddingCustom && activeDuaIndex === idx
                ? 'bg-[#2D5A46] text-white shadow-xs'
                : 'text-[#505255] hover:bg-[#F0F0EB] dark:text-[#A0A2A5] dark:hover:bg-[#202225]'
            }`}
          >
            {item.title.split('—')[0].replace('Supplication for ', '')}
          </button>
        ))}

        <button
          onClick={() => setIsAddingCustom(true)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed transition-colors ${
            isAddingCustom
              ? 'border-[#2D5A46] text-[#2D5A46] bg-[#2D5A46]/5 dark:text-[#4E9473]'
              : 'border-[#D0D0CA] text-[#717376] hover:border-[#1C1D1F] dark:border-[#3A3D42] dark:hover:border-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Personal Dua</span>
        </button>
      </div>

      {/* Active Dua Display */}
      {!isAddingCustom ? (
        <div className="bg-[#FAF8F5] dark:bg-[#141517] border border-[#EAE6DF] dark:border-[#24262A] rounded-xl p-6 md:p-8 space-y-6 text-center">
          <div className="flex items-center justify-between text-xs text-[#717376] dark:text-[#9A9CA0]">
            <span className="font-semibold text-[#1C1D1F] dark:text-[#FBFBF9]">{activeDua.title}</span>
            {activeDua.id.startsWith('dua_custom_') && (
              <button
                onClick={() => handleDeleteCustom(activeDua.id)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete custom Dua"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Arabic Calligraphy Typography */}
          {activeDua.arabic && (
            <p
              className="text-2xl md:text-3xl font-serif text-[#1C1D1F] dark:text-[#FBFBF9] leading-loose tracking-wide pt-2"
              dir="rtl"
              style={{ fontFamily: "'Scheherazade New', 'Amiri', serif" }}
            >
              {activeDua.arabic}
            </p>
          )}

          {/* Transliteration */}
          {activeDua.transliteration && (
            <p className="text-sm font-medium italic text-[#505255] dark:text-[#A0A2A5]">
              "{activeDua.transliteration}"
            </p>
          )}

          {/* English Translation */}
          <div className="pt-2 border-t border-[#EAE6DF] dark:border-[#24262A]">
            <p className="text-sm text-[#1C1D1F] dark:text-[#E0E2E5] leading-relaxed">
              {activeDua.translation}
            </p>
          </div>
        </div>
      ) : (
        /* Custom Dua Form */
        <form onSubmit={handleAddCustomDua} className="space-y-4 bg-[#F8F8F6] dark:bg-[#1A1C1F] p-5 rounded-xl border border-[#EAEAE4] dark:border-[#26282B]">
          <h4 className="text-sm font-bold text-[#1C1D1F] dark:text-[#FBFBF9]">
            Add Your Personal Supplication / Intention
          </h4>

          <div>
            <label className="block text-xs font-medium text-[#717376] dark:text-[#9A9CA0] mb-1">
              Title or Theme *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Supplication before Exam"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#717376] dark:text-[#9A9CA0] mb-1">
              Arabic Text (Optional)
            </label>
            <input
              type="text"
              dir="rtl"
              placeholder="Arabic calligraphy or script"
              value={customArabic}
              onChange={e => setCustomArabic(e.target.value)}
              className="w-full text-sm p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#717376] dark:text-[#9A9CA0] mb-1">
              Transliteration (Optional)
            </label>
            <input
              type="text"
              placeholder="Phonetic pronunciation"
              value={customTransliteration}
              onChange={e => setCustomTransliteration(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#717376] dark:text-[#9A9CA0] mb-1">
              Translation / Intention *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Your prayer, contemplation or intention in your language..."
              value={customTranslation}
              onChange={e => setCustomTranslation(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E0E0DA] dark:border-[#2E3136] bg-white dark:bg-[#141517] text-[#1C1D1F] dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="px-3 py-1.5 text-xs text-[#717376] hover:text-[#1C1D1F] dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#2D5A46] text-white text-xs font-semibold rounded-lg hover:bg-[#254B3A]"
            >
              Save Dua
            </button>
          </div>
        </form>
      )}

      {/* Confirmation to Proceed */}
      <div className="pt-2">
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D5A46] hover:bg-[#234737] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>I have Recited & Prepared my Intention</span>
        </button>
      </div>
    </div>
  );
};
