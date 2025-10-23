# Canvas Flow Builder - User Guide

## Getting Started

The new Canvas Flow Builder provides an intuitive, visual way to create automation hooks with drag-and-drop functionality.

## Desktop Experience

### Opening the Builder
Navigate to `/hook` to open the hook builder. You'll see:
- **Left Sidebar**: Node library with available triggers and actions
- **Center Canvas**: Infinite workspace for building flows
- **Top Bar**: Hook name, validation status, and action buttons

### Creating Your First Hook

#### Step 1: Add a Trigger
1. Find the **TRIGGERS** section in the left sidebar
2. Click on any trigger type (ONCHAIN, CRON, MANUAL, WEBHOOK)
3. The trigger node appears on the canvas
4. Click the node to configure it in the popup panel
5. Fill in required fields and click **Save**

#### Step 2: Add Actions
1. Scroll to the **ACTIONS** section in the sidebar
2. Click an action type (TELEGRAM, WEBHOOK, etc.)
3. The action node appears on the canvas
4. Connect trigger to action by dragging from the bottom handle of trigger to top handle of action
5. Click the action node to configure it

#### Step 3: Add More Actions (Sequential)
1. Click another action from the sidebar
2. Connect the previous action to this new action
3. Configure the new action
4. Repeat for as many actions as needed

#### Step 4: Save Your Hook
1. Give your hook a name in the top bar
2. Check the validation status (green = ready)
3. Click **Save Hook** button
4. Your hook is now active!

### Canvas Controls

#### Navigation
- **Pan**: Click and drag empty canvas space
- **Zoom**: Mouse wheel or pinch gesture
- **Minimap**: Click different areas to jump quickly

#### Node Operations
- **Select**: Click a node
- **Move**: Drag a node to reposition
- **Configure**: Click to open config panel
- **Connect**: Drag from handle to handle
- **Delete**: Select and press Delete key (or disconnect and remove)

### Using Templates

1. Click **Browse Templates** in the top bar
2. A drawer slides up with pre-built templates
3. Search or filter by category
4. Click **Use Template** on any template
5. The template loads onto your canvas
6. Customize as needed

### Validation

The builder validates your flow in real-time:
- ✅ **Green checkmark**: Ready to deploy
- ⚠️ **Yellow warning**: Issues detected (see count)
- Must have exactly 1 trigger
- Must have at least 1 action
- All nodes must be configured
- All nodes must be connected

## Mobile Experience

### Mobile Layout
On screens smaller than 1024px, you'll see a simplified vertical card interface:
- **Start** → **Trigger** → **Actions** → **End**

### Creating a Hook on Mobile

#### Step 1: Select Trigger
1. Tap on trigger type from the grid
2. A dialog opens for configuration
3. Fill in the form and tap **Save**

#### Step 2: Add Actions
1. Tap the **+ Add Action** button
2. Select action type from bottom sheet
3. Configure in the dialog
4. Tap **Save**

#### Step 3: Manage Actions
- **Edit**: Tap any card to reconfigure
- **Delete**: Tap the trash icon on the card
- **Reorder**: Drag cards (coming soon)

#### Step 4: Save
1. Name your hook at the top
2. Validation shows in the header
3. Tap **Save Hook**

## Configuration Forms

### Trigger Types

#### ONCHAIN
- **Contract Address**: Ethereum address (0x...)
- **Event Name**: Solidity event name (e.g., "Transfer")
- **Chain ID**: Select blockchain network

#### CRON
- **Cron Expression**: Schedule pattern (e.g., "0 9 * * *")
- **Timezone**: Select timezone for execution

#### WEBHOOK
- **Webhook URL**: HTTPS endpoint to listen on

#### MANUAL
- No configuration needed
- Run manually from dashboard

### Action Types

#### TELEGRAM
- **Bot Token**: From @BotFather on Telegram
- **Chat ID**: Your Telegram chat ID
- **Message Template**: Use `{variable}` for dynamic values

#### WEBHOOK
- **URL**: Destination endpoint
- **Method**: GET, POST, or PUT
- **Headers**: JSON object for custom headers

#### CONTRACT_CALL
- **Contract Address**: Target contract
- **Function Name**: Function to call
- **Parameters**: JSON array of parameters

#### CHAIN
- Triggers another hook
- Configuration coming soon

## Tips & Tricks

### Desktop

1. **Quick Add**: Click (don't drag) nodes from library to add at default position
2. **Multi-Select**: Hold Shift and click multiple nodes (coming soon)
3. **Zoom to Fit**: Use controls to fit all nodes in view
4. **Delete Connection**: Click an edge and press Delete
5. **Sidebar Toggle**: Click menu icon if sidebar is closed

### Mobile

1. **Scroll**: Swipe to scroll through your flow
2. **Quick Edit**: Single tap to edit any card
3. **Templates**: Swipe up template drawer to browse
4. **Validation**: Check top bar before saving

## Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| Delete | Remove selected node/edge |
| Cmd/Ctrl + Z | Undo (coming soon) |
| Cmd/Ctrl + Y | Redo (coming soon) |
| Space + Drag | Pan canvas |
| Escape | Deselect / Close panel |

## Variable Mapping (Coming Soon)

Future versions will support passing data between actions:
- Action 1 output → Action 2 input
- Use `{trigger.data}` in templates
- Type-safe variable picker
- Visual variable flow indicators

## Troubleshooting

### "Flow must have a trigger"
- Add a trigger node from the sidebar
- Only one trigger is allowed per flow

### "Action node is not connected"
- Draw a connection from trigger to action
- Or from previous action to this action

### "Node is not configured"
- Click the yellow-bordered node
- Fill in required fields
- Click Save

### Template won't load
- Check browser console for errors
- Refresh the page
- Try a different template

### Canvas is laggy with many nodes
- Close the node library sidebar
- Zoom out to see fewer nodes
- Use minimap for navigation
- Performance optimizations coming

## Best Practices

1. **Name Your Hook**: Give descriptive names for easy identification
2. **Test Configurations**: Verify addresses and credentials before saving
3. **Start with Templates**: Use templates as starting points
4. **Keep Flows Simple**: Break complex automations into multiple hooks
5. **Document with Descriptions**: Add descriptions to hooks for future reference

## Example Workflows

### Simple Notification
```
ONCHAIN Trigger (USDC Transfer)
  ↓
TELEGRAM Action (Send message)
```

### Multi-Step Alert
```
ONCHAIN Trigger (NFT Sale)
  ↓
TELEGRAM Action (Alert team)
  ↓
WEBHOOK Action (Update database)
  ↓
TELEGRAM Action (Confirm to user)
```

### Scheduled Task
```
CRON Trigger (Daily at 9 AM)
  ↓
WEBHOOK Action (Fetch data)
  ↓
TELEGRAM Action (Send summary)
```

## Need Help?

- Check validation errors at the top
- Review this guide
- Check the implementation summary
- Look at example templates
- Report issues on GitHub

