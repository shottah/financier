# Dashboard Grid System

## Overview
The dashboard uses a modifiable grid system where users can add, remove, and rearrange widgets. The layout is saved in cookies for persistence.

## Grid Configuration
- **Grid Size**: 8 columns × 16 rows
- **Responsive**: Adapts to different screen sizes (lg: 8, md: 8, sm: 4, xs: 2 columns)
- **Row Height**: 30px per row

## Key Components

### DashboardGrid
Main container that manages the grid layout and widget state.
- Loads/saves layout from cookies
- Handles widget addition/removal
- Manages drag-and-drop functionality

### DashboardWidget
Wrapper component that renders widgets and provides remove functionality.
- Shows remove button on hover
- Renders appropriate widget based on type

### WidgetSidebar
Sidebar panel for adding new widgets to the dashboard.
- Lists available widgets
- Shows widget preview and description

### Widget Types
Currently available widgets:
1. **spending-categories**: Top Spending Categories widget showing YoY and QoQ trends

## Adding New Widgets

To add a new widget type:

1. Create the widget component in `src/components/Dashboard/widgets/`
2. Add the widget type to the switch statement in `DashboardWidget.tsx`
3. Add the widget configuration to `AVAILABLE_WIDGETS` in `WidgetSidebar.tsx`

## Layout Storage
Layouts are stored in cookies with the key `dashboard-layout` and expire after 365 days.

The stored data includes:
- Widget configurations (type, position, size)
- Responsive layout information for different breakpoints