import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import EventsDashboard from './components/EventsDashboard'
import SettingsManager from './components/SettingsManager'

const API_BASE = 'http://localhost:4000/api'

function App() {
  // Navigation Routing Tab
  const [activeTab, setActiveTab] = useState('events') // 'events' | 'settings'

  // DB States
  const [settings, setSettings] = useState([])
  const [events, setEvents] = useState([])
  
  // Selected configuration state (null = new configuration)
  const [selectedSettingId, setSelectedSettingId] = useState(null)

  // Form Fields
  const [configName, setConfigName] = useState('Sự kiện Tokyo Mới')
  const [url, setUrl] = useState('https://events.example.com')
  const [itemSelector, setItemSelector] = useState('')
  const [itemSelectorType, setItemSelectorType] = useState('css')
  const [titleSelector, setTitleSelector] = useState('')
  const [titleSelectorType, setTitleSelectorType] = useState('css')
  const [imageSelector, setImageSelector] = useState('')
  const [imageSelectorType, setImageSelectorType] = useState('css')
  const [descriptionSelector, setDescriptionSelector] = useState('')
  const [descriptionSelectorType, setDescriptionSelectorType] = useState('css')
  
  // Crawler Advanced Options
  const [autoScroll, setAutoScroll] = useState(true)
  const [maxScrollHeight, setMaxScrollHeight] = useState(5000)
  const [waitAfterScroll, setWaitAfterScroll] = useState(2000)
  const [autoCrawlEnabled, setAutoCrawlEnabled] = useState(false)

  // UI Status
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [previewItem, setPreviewItem] = useState(null)
  
  // Filter Tag state
  const [activeFilter, setActiveFilter] = useState('unread')

  // Fetch initial data
  useEffect(() => {
    fetchSettings()
    fetchEvents()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`)
      const data = await res.json()
      if (res.ok) setSettings(data)
    } catch (err) {
      console.error('Error fetching settings:', err)
    }
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`)
      const data = await res.json()
      if (res.ok) setEvents(data)
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  }

  // Load a saved setting into the form
  const handleSelectSetting = (setting) => {
    setSelectedSettingId(setting.id)
    setConfigName(setting.name || 'Cấu hình cào')
    setUrl(setting.url)
    setItemSelector(setting.itemSelector || '')
    setItemSelectorType(setting.itemSelectorType || 'css')
    setTitleSelector(setting.titleSelector || '')
    setTitleSelectorType(setting.titleSelectorType || 'css')
    setImageSelector(setting.imageSelector || '')
    setImageSelectorType(setting.imageSelectorType || 'css')
    setDescriptionSelector(setting.descriptionSelector || '')
    setDescriptionSelectorType(setting.descriptionSelectorType || 'css')
    setAutoScroll(setting.autoScroll !== undefined ? setting.autoScroll : true)
    setMaxScrollHeight(setting.maxScrollHeight || 5000)
    setWaitAfterScroll(setting.waitAfterScroll || 2000)
    setAutoCrawlEnabled(setting.autoCrawlEnabled !== undefined ? setting.autoCrawlEnabled : false)
    setPreviewItem(null)
    setError('')
    setSuccessMsg('')
  }

  // Clear form to create a new setting
  const handleNewSetting = () => {
    setSelectedSettingId(null)
    setConfigName('Sự kiện Mới')
    setUrl('https://')
    setItemSelector('')
    setItemSelectorType('css')
    setTitleSelector('')
    setTitleSelectorType('css')
    setImageSelector('')
    setImageSelectorType('css')
    setDescriptionSelector('')
    setDescriptionSelectorType('css')
    setAutoScroll(true)
    setMaxScrollHeight(5000)
    setWaitAfterScroll(2000)
    setAutoCrawlEnabled(false)
    setPreviewItem(null)
    setError('')
    setSuccessMsg('')
  }

  // Preview only 1 card, without scrolling
  const handlePreview = async () => {
    setPreviewLoading(true)
    setError('')
    setSuccessMsg('')
    setPreviewItem(null)

    try {
      const res = await fetch(`${API_BASE}/crawl/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          itemSelector,
          itemSelectorType,
          titleSelector,
          titleSelectorType,
          imageSelector,
          imageSelectorType,
          descriptionSelector,
          descriptionSelectorType,
          autoScroll: false, // Don't scroll in preview
          waitAfterScroll: waitAfterScroll, // Wait for image load option is respected
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate preview')

      if (data.items && data.items.length > 0) {
        setPreviewItem(data.items[0])
      } else {
        throw new Error('Không tìm thấy card nào với selector hiện tại. Hãy kiểm tra lại!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Save config AND perform full crawl
  const handleSaveAndCrawl = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      // 1. Save Setting
      const saveRes = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSettingId || undefined,
          name: configName,
          url,
          itemSelector,
          itemSelectorType,
          titleSelector,
          titleSelectorType,
          imageSelector,
          imageSelectorType,
          descriptionSelector,
          descriptionSelectorType,
          autoScroll,
          maxScrollHeight: Number(maxScrollHeight) || 5000,
          waitAfterScroll: Number(waitAfterScroll) || 2000,
          autoCrawlEnabled
        })
      })

      const savedConfig = await saveRes.json()
      if (!saveRes.ok) throw new Error(savedConfig.error || 'Failed to save configuration settings')

      setSelectedSettingId(savedConfig.id)
      await fetchSettings()

      // 2. Perform Crawl
      setSuccessMsg('Đã lưu cấu hình! Đang tiến hành crawl bài viết mới...')
      const crawlRes = await fetch(`${API_BASE}/settings/${savedConfig.id}/crawl`, {
        method: 'POST'
      })

      const crawlData = await crawlRes.json()
      if (!crawlRes.ok) throw new Error(crawlData.error || 'Failed to execute crawler')

      setSuccessMsg(`Crawl hoàn tất! Đã cập nhật danh sách bài viết từ database.`)
      fetchEvents()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete Setting
  const handleDeleteSetting = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Bạn có chắc muốn xóa cấu hình này? Toàn bộ các bài viết thuộc cấu hình này cũng sẽ bị xóa.')) return

    try {
      const res = await fetch(`${API_BASE}/settings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (selectedSettingId === id) {
          handleNewSetting()
        }
        fetchSettings()
        fetchEvents()
        setSuccessMsg('Xóa cấu hình thành công.')
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete setting')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  // Update Event Tag Status
  const handleToggleTag = async (eventItem, tag) => {
    let newTags = [...(eventItem.statusTags || [])]
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag)
    } else {
      newTags.push(tag)
    }

    try {
      const res = await fetch(`${API_BASE}/events/${eventItem.id}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusTags: newTags })
      })
      if (res.ok) {
        // Optimistic UI update
        setEvents(events.map(ev => ev.id === eventItem.id ? { ...ev, statusTags: newTags } : ev))
      }
    } catch (err) {
      console.error('Failed to update event tag:', err)
    }
  }

  // Delete Event Permanently
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này khỏi DB?')) return
    try {
      const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEvents(events.filter(ev => ev.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  // Toggle Auto Crawl directly from list
  const handleToggleSettingScheduler = async (setting, e) => {
    e.stopPropagation()
    const updatedStatus = !setting.autoCrawlEnabled
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...setting,
          autoCrawlEnabled: updatedStatus
        })
      })
      if (res.ok) {
        fetchSettings()
      }
    } catch (err) {
      console.error('Failed to toggle auto crawl scheduler:', err)
    }
  }

  return (
    <div className="app-shell">
      {/* Top Navigation Router */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Messages */}
      {error && <p className="error" style={{ marginBottom: '16px' }}>{error}</p>}
      {successMsg && <p className="success" style={{ marginBottom: '16px' }}>{successMsg}</p>}

      {/* Routed Screens */}
      {activeTab === 'events' ? (
        <EventsDashboard
          events={events}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          handleToggleTag={handleToggleTag}
          handleDeleteEvent={handleDeleteEvent}
        />
      ) : (
        <SettingsManager
          settings={settings}
          selectedSettingId={selectedSettingId}
          handleSelectSetting={handleSelectSetting}
          handleNewSetting={handleNewSetting}
          handleDeleteSetting={handleDeleteSetting}
          handleToggleSettingScheduler={handleToggleSettingScheduler}
          
          configName={configName}
          setConfigName={setConfigName}
          url={url}
          setUrl={setUrl}
          itemSelector={itemSelector}
          setItemSelector={setItemSelector}
          itemSelectorType={itemSelectorType}
          setItemSelectorType={setItemSelectorType}
          titleSelector={titleSelector}
          setTitleSelector={setTitleSelector}
          titleSelectorType={titleSelectorType}
          setTitleSelectorType={setTitleSelectorType}
          imageSelector={imageSelector}
          setImageSelector={setImageSelector}
          imageSelectorType={imageSelectorType}
          setImageSelectorType={setImageSelectorType}
          descriptionSelector={descriptionSelector}
          setDescriptionSelector={setDescriptionSelector}
          descriptionSelectorType={descriptionSelectorType}
          setDescriptionSelectorType={setDescriptionSelectorType}
          
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
          maxScrollHeight={maxScrollHeight}
          setMaxScrollHeight={setMaxScrollHeight}
          waitAfterScroll={waitAfterScroll}
          setWaitAfterScroll={setWaitAfterScroll}
          autoCrawlEnabled={autoCrawlEnabled}
          setAutoCrawlEnabled={setAutoCrawlEnabled}
          
          handlePreview={handlePreview}
          handleSaveAndCrawl={handleSaveAndCrawl}
          previewLoading={previewLoading}
          loading={loading}
          previewItem={previewItem}
        />
      )}
    </div>
  )
}

export default App
