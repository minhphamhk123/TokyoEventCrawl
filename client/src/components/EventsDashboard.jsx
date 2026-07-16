import React from 'react'

function EventsDashboard({
  events,
  activeFilter,
  setActiveFilter,
  handleToggleTag,
  handleDeleteEvent
}) {
  const filteredEvents = events.filter(ev => {
    const tags = ev.statusTags || []
    switch (activeFilter) {
      case 'read':
        return tags.includes('read') && !tags.includes('ignored')
      case 'past':
        return tags.includes('past') && !tags.includes('ignored')
      case 'ignored':
        return tags.includes('ignored')
      case 'unread':
        return !tags.includes('read') && !tags.includes('past') && !tags.includes('ignored')
      case 'all':
      default:
        return true
    }
  })

  return (
    <div className="events-dashboard">
      <div className="dashboard-intro">
        <h2>Sự kiện Tokyo đã thu thập</h2>
        <p className="subtitle">
          Quản lý các sự kiện đã cào. Đánh dấu trạng thái hoặc xóa bài viết khỏi database.
        </p>
      </div>

      {/* Filters and Counters */}
      <section className="filter-bar">
        <button
          className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveFilter('unread')}
        >
          Chưa đọc ({events.filter(e => !(e.statusTags || []).some(t => ['read', 'past', 'ignored'].includes(t))).length})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'read' ? 'active' : ''}`}
          onClick={() => setActiveFilter('read')}
        >
          Đã đọc ({events.filter(e => (e.statusTags || []).includes('read') && !(e.statusTags || []).includes('ignored')).length})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'past' ? 'active' : ''}`}
          onClick={() => setActiveFilter('past')}
        >
          Sự kiện đã qua ({events.filter(e => (e.statusTags || []).includes('past') && !(e.statusTags || []).includes('ignored')).length})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'ignored' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ignored')}
        >
          Không quan tâm ({events.filter(e => (e.statusTags || []).includes('ignored')).length})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tất cả ({events.length})
        </button>
      </section>

      {/* Grid listing */}
      <section className="results">
        {filteredEvents.length === 0 ? (
          <div className="empty-events panel">
            <p>Không có bài viết nào phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredEvents.map((item) => {
              const tags = item.statusTags || []
              return (
                <div key={item.id} className={`event-card ${tags.includes('ignored') ? 'ignored-card' : ''}`}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} />
                  ) : (
                    <div className="placeholder">Không có hình ảnh</div>
                  )}
                  <div className="card-body">
                    {/* Status Badges */}
                    <div className="card-badges">
                      {tags.includes('read') && <span className="badge badge-read">Đã đọc</span>}
                      {tags.includes('past') && <span className="badge badge-past">Đã qua</span>}
                      {tags.includes('ignored') && <span className="badge badge-ignored">Bỏ qua</span>}
                    </div>

                    <h3>{item.title || 'Untitled event'}</h3>
                    <p>{item.description || 'No description available.'}</p>

                    <div className="card-actions">
                      <a href={item.href} target="_blank" rel="noreferrer" className="btn-visit" title="Mở link gốc">
                        🌐 Xem
                      </a>
                      <button
                        className={`btn-tag ${tags.includes('read') ? 'active' : ''}`}
                        onClick={() => handleToggleTag(item, 'read')}
                        title={tags.includes('read') ? 'Bỏ đánh dấu Đã đọc' : 'Đánh dấu Đã đọc'}
                      >
                        👁️
                      </button>
                      <button
                        className={`btn-tag ${tags.includes('past') ? 'active' : ''}`}
                        onClick={() => handleToggleTag(item, 'past')}
                        title={tags.includes('past') ? 'Bỏ đánh dấu Đã qua' : 'Đánh dấu Sự kiện đã qua'}
                      >
                        📅
                      </button>
                      <button
                        className={`btn-tag ${tags.includes('ignored') ? 'active' : ''}`}
                        onClick={() => handleToggleTag(item, 'ignored')}
                        title={tags.includes('ignored') ? 'Quan tâm lại' : 'Đánh dấu Không quan tâm'}
                      >
                        🚫
                      </button>
                      <button
                        className="btn-delete-event"
                        onClick={() => handleDeleteEvent(item.id)}
                        title="Xóa vĩnh viễn khỏi DB"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default EventsDashboard
