# Todo App with Local Storage

A modern, fully-featured todo list application with persistent local storage functionality.

## Features

### Core Features
- ✅ **Add Tasks** - Create new tasks with a simple input
- ✏️ **Edit Tasks** - Modify existing tasks
- 🗑️ **Delete Tasks** - Remove individual tasks
- ✓ **Mark Complete** - Toggle task completion status
- 💾 **Local Storage** - All data persists in browser storage

### Advanced Features
- 🎯 **Priority Levels** - Set tasks as Low, Medium, or High priority
- 📂 **Categories** - Organize tasks (Work, Personal, Shopping, Health, Other)
- 🔍 **Filtering** - View All, Active, or Completed tasks
- 📊 **Statistics** - Real-time task counters
- 📅 **Dates** - Auto-generated creation timestamps
- 📤 **Export** - Download tasks as JSON file
- 📥 **Import** - Load tasks from JSON file
- 🎨 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌙 **Clean UI** - Modern gradient design with smooth animations

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Storage**: Browser LocalStorage API
- **Icons**: Font Awesome 6.4.0
- **Design**: Responsive CSS with Flexbox

## How to Use

### Installation

1. Clone or download the project
2. Open `index.html` in your web browser
3. Start adding tasks!

### Adding Tasks

1. Enter task text in the input field
2. (Optional) Select priority level
3. (Optional) Select category
4. Click "Add" button or press Enter

### Managing Tasks

- **Complete**: Click checkbox to mark task as done
- **Edit**: Click edit icon to modify task text
- **Delete**: Click delete icon to remove task
- **Filter**: Use filter buttons to view specific tasks
- **Clear Completed**: Remove all completed tasks at once

### Import/Export

**Export Tasks:**
- Click "Export" button
- JSON file downloads with current date
- File can be backed up or shared

**Import Tasks:**
- Click "Import" button
- Select a previously exported JSON file
- Confirm to replace or merge tasks

## Data Structure

Each task is stored with the following structure:

```json
{
  "id": 1720502400000,
  "text": "Buy groceries",
  "completed": false,
  "priority": "medium",
  "category": "shopping",
  "createdAt": "2024-07-09T10:00:00.000Z"
}
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Opera: ✅ Full support
- IE: ❌ Not supported

## Local Storage Details

- **Storage Key**: `todos`
- **Storage Type**: JSON string array
- **Capacity**: ~5-10MB per domain (browser dependent)
- **Persistence**: Data persists across browser sessions
- **Privacy**: Data stored locally, never sent to server

## Color Coding

### Priority Indicators
- 🔴 **High**: Red border
- 🟡 **Medium**: Yellow border
- 🟢 **Low**: Green border

### Badges
- Priority badge (red background)
- Category badge (blue background)
- Creation date

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Add new task |
| Click checkbox | Toggle completion |

## File Structure

```
todo-app/
├── index.html      # Main HTML file
├── styles.css      # Styling and responsive design
├── app.js          # Application logic
└── README.md       # Documentation
```

## Features Explained

### Priority System
Tasks can be assigned one of three priority levels:
- **Low**: Non-urgent tasks
- **Medium**: Standard priority (default)
- **High**: Urgent tasks requiring immediate attention

### Category System
Organize tasks by category:
- **Work**: Professional and work-related tasks
- **Personal**: Personal life tasks
- **Shopping**: Shopping and errands
- **Health**: Health and wellness tasks
- **Other**: Miscellaneous tasks

### Filter Options
- **All**: Show all tasks regardless of status
- **Active**: Show only uncompleted tasks
- **Completed**: Show only completed tasks

## Tips & Tricks

1. **Backup Your Tasks**: Regularly export your tasks as JSON
2. **Organize by Category**: Use categories to keep tasks organized
3. **Use Priorities Wisely**: Focus on high-priority tasks first
4. **Clear Completed**: Regularly clear completed tasks to reduce clutter
5. **Mobile Friendly**: Access your tasks from any device with a browser

## Future Enhancements

Potential improvements:
- 🔐 Password protection
- ☁️ Cloud sync
- 🔔 Browser notifications
- 📱 PWA support
- 🌍 Internationalization
- 🎨 Theme customization
- 🏷️ Custom tags
- ⏰ Due dates and reminders
- 🔗 Task dependencies
- 📈 Progress tracking

## License

Free to use and modify

## Support

For issues or suggestions, please create an issue in the repository.

## Author

Created with ❤️ for task management
