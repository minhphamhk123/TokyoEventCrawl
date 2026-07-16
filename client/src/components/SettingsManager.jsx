import React, { useState } from 'react'

function SettingsManager({
  settings,
  selectedSettingId,
  handleSelectSetting,
  handleNewSetting,
  handleDeleteSetting,
  handleToggleSettingScheduler,
  
  // Form states and handlers
  configName, setConfigName,
  url, setUrl,
  itemSelector, setItemSelector,
  itemSelectorType, setItemSelectorType,
  titleSelector, setTitleSelector,
  titleSelectorType, setTitleSelectorType,
  imageSelector, setImageSelector,
  imageSelectorType, setImageSelectorType,
  descriptionSelector, setDescriptionSelector,
  descriptionSelectorType, setDescriptionSelectorType,
  autoScroll, setAutoScroll,
  maxScrollHeight, setMaxScrollHeight,
  waitAfterScroll, setWaitAfterScroll,
  autoCrawlEnabled, setAutoCrawlEnabled,
  
  // Submit handlers
  handlePreview,
  handleSaveAndCrawl,
  previewLoading,
  loading,
  previewItem
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="settings-manager">
      {/* Sidebar list */}
      <div className="settings-list-container panel">
        <div className="sidebar-header">
          <h3>Cấu hình đã lưu</h3>
          <button type="button" className="btn-new-setting" onClick={handleNewSetting}>
            + Thêm mới
          </button>
        </div>

        <div className="settings-list">
          {settings.length === 0 ? (
            <p className="empty-sidebar">Chưa có cấu hình nào được lưu.</p>
          ) : (
            settings.map((s) => (
              <div
                key={s.id}
                className={`setting-item ${selectedSettingId === s.id ? 'active' : ''}`}
                onClick={() => handleSelectSetting(s)}
              >
                <div className="setting-info">
                  <h4>{s.name}</h4>
                  <p className="setting-url" title={s.url}>{s.url}</p>
                  {s.lastCrawled && (
                    <span className="last-crawled">Cập nhật: {new Date(s.lastCrawled).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  )}
                </div>
                <div className="setting-actions">
                  <button
                    type="button"
                    className={`btn-toggle-auto ${s.autoCrawlEnabled ? 'enabled' : ''}`}
                    onClick={(e) => handleToggleSettingScheduler(s, e)}
                    title={s.autoCrawlEnabled ? 'Auto crawl: Bật (7:00 sáng)' : 'Auto crawl: Tắt'}
                  >
                    ⏰
                  </button>
                  <button type="button" className="btn-delete" onClick={(e) => handleDeleteSetting(s.id, e)} title="Xóa">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor container */}
      <div className="editor-container">
        <form className="config-form panel" onSubmit={handleSaveAndCrawl}>
          <h3>{selectedSettingId ? 'Chỉnh sửa Cấu hình' : 'Tạo Cấu hình Mới'}</h3>
          
          <label>
            Tên cấu hình
            <input
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Ví dụ: Sự kiện Art Tokyo"
              required
            />
          </label>

          <label>
            URL trang đích
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/events"
              required
            />
          </label>

          <label>
            Selector từng card (Item Container)
            <div className="input-group">
              <input
                value={itemSelector}
                onChange={(e) => setItemSelector(e.target.value)}
                placeholder=".card hoặc article"
              />
              <select value={itemSelectorType} onChange={(e) => setItemSelectorType(e.target.value)}>
                <option value="css">CSS Selector</option>
                <option value="class">Tên Class</option>
                <option value="tag">Thẻ HTML</option>
                <option value="id">ID</option>
              </select>
            </div>
          </label>

          <div className="selectors-grid">
            <label>
              Selector Title
              <div className="input-group">
                <input
                  value={titleSelector}
                  onChange={(e) => setTitleSelector(e.target.value)}
                  placeholder="h2 hoặc .title"
                />
                <select value={titleSelectorType} onChange={(e) => setTitleSelectorType(e.target.value)}>
                  <option value="css">CSS</option>
                  <option value="class">Class</option>
                  <option value="tag">Tag</option>
                  <option value="id">ID</option>
                </select>
              </div>
            </label>

            <label>
              Selector Mô tả
              <div className="input-group">
                <input
                  value={descriptionSelector}
                  onChange={(e) => setDescriptionSelector(e.target.value)}
                  placeholder="p hoặc .desc"
                />
                <select value={descriptionSelectorType} onChange={(e) => setDescriptionSelectorType(e.target.value)}>
                  <option value="css">CSS</option>
                  <option value="class">Class</option>
                  <option value="tag">Tag</option>
                  <option value="id">ID</option>
                </select>
              </div>
            </label>
          </div>

          <label>
            Selector Hình ảnh
            <div className="input-group">
              <input
                value={imageSelector}
                onChange={(e) => setImageSelector(e.target.value)}
                placeholder="img hoặc .thumb"
              />
              <select value={imageSelectorType} onChange={(e) => setImageSelectorType(e.target.value)}>
                <option value="css">CSS Selector</option>
                <option value="class">Tên Class</option>
                <option value="tag">Thẻ HTML</option>
                <option value="id">ID</option>
              </select>
            </div>
          </label>

          {/* Collapsible Advanced settings */}
          <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            <span>{showAdvanced ? '▼' : '▶'} Tùy chọn cào nâng cao (Lazy & Auto Scroll)</span>
          </div>

          {showAdvanced && (
            <div className="advanced-panel">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                Tự động cuộn trang (Auto Scroll)
              </label>

              <label>
                Cuộn tối đa (px)
                <input
                  type="number"
                  value={maxScrollHeight}
                  onChange={(e) => setMaxScrollHeight(Number(e.target.value) || 0)}
                  placeholder="5000"
                  disabled={!autoScroll}
                />
              </label>

              <label>
                Chờ tải ảnh và lazy items
                <select
                  value={waitAfterScroll}
                  onChange={(e) => setWaitAfterScroll(Number(e.target.value))}
                >
                  <option value={0}>Không chờ</option>
                  <option value={1000}>1 giây</option>
                  <option value={2000}>2 giây (Mặc định)</option>
                  <option value={3000}>3 giây</option>
                  <option value={5000}>5 giây</option>
                </select>
              </label>

              <label className="checkbox-label" style={{ marginTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={autoCrawlEnabled}
                  onChange={(e) => setAutoCrawlEnabled(e.target.checked)}
                />
                Auto crawl hàng ngày (7:00 sáng)
              </label>
            </div>
          )}

          <div className="form-buttons">
            <button
              type="button"
              className="btn-preview"
              onClick={handlePreview}
              disabled={previewLoading || loading}
            >
              {previewLoading ? 'Đang tải thử...' : 'Xem thử 1 Card'}
            </button>
            
            <button type="submit" className="btn-save-crawl" disabled={loading || previewLoading}>
              {loading ? 'Đang crawl & lưu...' : 'Lưu & Crawl'}
            </button>
          </div>
        </form>

        {/* Live Preview Panel */}
        {previewItem && (
          <div className="preview-container panel">
            <h4>Bản xem thử 1 card (Không scroll):</h4>
            <div className="event-card preview-card">
              {previewItem.image ? (
                <img src={previewItem.image} alt={previewItem.title} />
              ) : (
                <div className="placeholder">Không có hình ảnh</div>
              )}
              <div className="card-body">
                <h3>{previewItem.title}</h3>
                <p>{previewItem.description}</p>
                <div className="preview-footer">
                  <a href={previewItem.href} target="_blank" rel="noreferrer" className="btn-link-raw">
                    Xem liên kết gốc 🔗
                  </a>
                </div>
              </div>
            </div>
            <p className="preview-tip">💡 Nếu thông tin hiển thị đúng, nhấn nút <b>Lưu & Crawl</b> bên trên để bắt đầu cào đầy đủ và lưu vào database.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsManager
