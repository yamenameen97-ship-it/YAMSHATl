import { useEffect, useMemo, useState, useRef } from 'react';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StoryViewer from '../../components/stories/StoryViewer.jsx';
import StoryEditor from '../../components/stories/StoryEditor.jsx';
import { getStories, getStoryArchive } from '../../api/stories.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoriesPage() {
  const [activeTab, setActiveTab] = useState('feed'); // feed, archive, create
  const [stories, setStories] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sRes, aRes] = await Promise.all([getStories(), getStoryArchive()]);
      setStories(sRes.data || []);
      setArchive(aRes.data || []);
    } catch (err) {
      console.error("Failed to load stories", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setActiveTab('create');
    }
  };

  // Story queue optimization
  const storyGroups = useMemo(() => {
    const groups = {};
    stories.forEach(s => {
      if (!groups[s.username]) groups[s.username] = { username: s.username, stories: [] };
      groups[s.username].stories.push(s);
    });
    return Object.values(groups);
  }, [stories]);

  // Preload next story
  useEffect(() => {
    const nextGroup = storyGroups[currentGroupIndex + 1];
    if (nextGroup) {
      nextGroup.stories.forEach(s => {
        const img = new Image();
        img.src = s.media_url;
      });
    }
  }, [currentGroupIndex, storyGroups]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 10px' }}>
        
        {/* Header Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <Button variant="secondary" onClick={() => setActiveTab('feed')} style={{ background: activeTab === 'feed' ? 'var(--primary)' : '' }}>القصص</Button>
          <Button variant="secondary" onClick={() => setActiveTab('archive')} style={{ background: activeTab === 'archive' ? 'var(--primary)' : '' }}>🗄️ الأرشيف</Button>
          <label style={{ marginLeft: 'auto' }}>
            <input type="file" hidden onChange={handleFileSelect} accept="image/*,video/*" />
            <Button as="span" style={{ cursor: 'pointer' }}>➕ قصة جديدة</Button>
          </label>
        </div>

        {activeTab === 'feed' && (
          <div style={{ display: 'flex', gap: 15, overflowX: 'auto', padding: '10px 0' }}>
            {storyGroups.map((group, idx) => (
              <motion.div
                key={group.username}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setCurrentGroupIndex(idx);
                  setIsViewerOpen(true);
                }}
                style={{ 
                  flexShrink: 0, width: 70, height: 70, borderRadius: '50%', 
                  border: '3px solid var(--primary)', padding: 2, cursor: 'pointer' 
                }}
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${group.username}`} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                  alt={group.username}
                />
                <div style={{ fontSize: 10, textAlign: 'center', marginTop: 4, color: 'white' }}>{group.username}</div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'archive' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {archive.map(story => (
              <div key={story.id} style={{ aspectRatio: '9/16', background: '#222', borderRadius: 8, overflow: 'hidden' }}>
                <img src={story.media_url} alt="archived" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <StoryEditor 
            file={selectedFile} 
            onClose={() => setActiveTab('feed')} 
            onSuccess={() => {
              setActiveTab('feed');
              loadData();
            }}
          />
        )}
      </div>

      <AnimatePresence>
        {isViewerOpen && (
          <StoryViewer 
            group={storyGroups[currentGroupIndex]} 
            onClose={() => setIsViewerOpen(false)}
            onNext={() => {
              if (currentGroupIndex < storyGroups.length - 1) {
                setCurrentGroupIndex(prev => prev + 1);
              } else {
                setIsViewerOpen(false);
              }
            }}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
