# Development Guide

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project setup

### Installation
```bash
npm install
```

### Environment Setup
1. Update Firebase configuration in `src/firebase.js`
2. Ensure Firebase Realtime Database rules allow read/write access
3. Set up Firebase project with the required structure

### Running the Application
```bash
npm start
```

## Development Workflow

### Adding New Components

1. **Create component file** in `src/components/`
```javascript
// src/components/MyNewComponent.js
import React from 'react';

function MyNewComponent({ prop1, prop2 }) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}

export default MyNewComponent;
```

2. **Export from index** in `src/components/index.js`
```javascript
export { default as MyNewComponent } from './MyNewComponent';
```

3. **Use in parent components**
```javascript
import { MyNewComponent } from '../components';
```

### Creating Custom Hooks

1. **Add hook to** `src/hooks/`
```javascript
// src/hooks/useMyFeature.js
import { useState, useEffect } from 'react';

export function useMyFeature() {
  const [state, setState] = useState(null);
  
  // Hook logic here
  
  return { state, setState };
}
```

2. **Export from** `src/hooks/index.js` (create if needed)
```javascript
export { useMyFeature } from './useMyFeature';
```

### Adding Utility Functions

1. **Create utility file** in `src/utils/`
```javascript
// src/utils/myUtils.js
export function myUtilFunction(input) {
  return processedOutput;
}
```

2. **Export from** `src/utils/index.js`
```javascript
export * from './myUtils';
```

### Adding Constants

1. **Add to** `src/constants/index.js`
```javascript
export const MY_CONSTANTS = {
  VALUE1: 'value1',
  VALUE2: 'value2',
};
```

### Firebase Service Methods

1. **Add method to** `src/services/firebaseService.js`
```javascript
export const FirebaseService = {
  // ... existing methods
  
  async myNewMethod(param) {
    const ref = ref(db, `path/${param}`);
    // Firebase operation
    return result;
  },
};
```

## Code Style Guidelines

### Component Structure
```javascript
import React from 'react';
import { AntdComponents } from 'antd';
import { IconName } from '@ant-design/icons';
import { utilityFunctions } from '../utils';
import { CONSTANTS } from '../constants';

function ComponentName({ prop1, prop2, onAction }) {
  // State declarations
  const [state, setState] = useState(initialValue);
  
  // Custom hooks
  const { hookData, hookActions } = useCustomHook();
  
  // Event handlers
  const handleEvent = (event) => {
    // Handle event
  };
  
  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // Render helpers (if needed)
  const renderSubComponent = () => {
    return <div>Sub component</div>;
  };
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

export default ComponentName;
```

### Naming Conventions
- **Components**: PascalCase (`MyComponent`)
- **Files**: PascalCase for components (`MyComponent.js`)
- **Hooks**: camelCase starting with 'use' (`useMyHook`)
- **Functions**: camelCase (`myFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **Props**: camelCase (`myProp`, `onMyAction`)

### Props Conventions
- **Event handlers**: Start with 'on' (`onClick`, `onSubmit`)
- **Boolean props**: Use 'is' or 'has' prefix (`isVisible`, `hasError`)
- **Data props**: Descriptive names (`userData`, `sessionInfo`)

## Testing

### Component Testing
```javascript
// src/components/__tests__/MyComponent.test.js
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

test('renders component correctly', () => {
  render(<MyComponent prop1="value" />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### Utility Testing
```javascript
// src/utils/__tests__/myUtils.test.js
import { myUtilFunction } from '../myUtils';

test('utility function works correctly', () => {
  const result = myUtilFunction('input');
  expect(result).toBe('expected output');
});
```

### Hook Testing
```javascript
// src/hooks/__tests__/useMyHook.test.js
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

test('hook returns expected values', () => {
  const { result } = renderHook(() => useMyHook());
  expect(result.current.someValue).toBeDefined();
});
```

## Performance Considerations

### Component Optimization
- Use `React.memo` for components that receive stable props
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to child components

### Firebase Optimization
- Unsubscribe from listeners in cleanup functions
- Use Firebase rules to limit data access
- Implement proper error handling

### Bundle Optimization
- Import only needed Ant Design components
- Use code splitting for large components
- Optimize images and assets

## Common Patterns

### Form Handling
```javascript
const [form] = Form.useForm();

const handleSubmit = async (values) => {
  try {
    await someAsyncOperation(values);
    message.success('Success message');
    form.resetFields();
  } catch (error) {
    message.error(`Error: ${error.message}`);
  }
};
```

### Data Fetching with Cleanup
```javascript
useEffect(() => {
  const unsubscribe = FirebaseService.listenToData((data) => {
    setData(data);
  });
  
  return unsubscribe; // Cleanup
}, []);
```

### Conditional Rendering
```javascript
// Early return for loading/error states
if (loading) return <Spin />;
if (error) return <Alert type="error" message={error} />;

// Conditional content
{someCondition && <ComponentToShow />}
{data.length > 0 ? <DataComponent data={data} /> : <EmptyState />}
```

## Debugging

### Firebase Issues
1. Check browser console for Firebase errors
2. Verify Firebase configuration
3. Check Firebase rules and permissions
4. Use Firebase emulator for local development

### Component Issues
1. Use React Developer Tools
2. Add console.logs strategically
3. Check prop types and data flow
4. Verify state updates

### Performance Issues
1. Use React Profiler
2. Check for unnecessary re-renders
3. Monitor Firebase usage
4. Optimize large lists with virtualization

## Deployment

### Build for Production
```bash
npm run build
```

### Firebase Hosting (optional)
```bash
firebase deploy --only hosting
```

### Environment Variables
Create `.env` files for different environments:
- `.env.development`
- `.env.production`

## Maintenance

### Regular Tasks
1. Update dependencies regularly
2. Review and update Firebase rules
3. Monitor performance metrics
4. Clean up unused code
5. Update documentation

### Code Reviews
- Check component structure and props
- Verify error handling
- Ensure consistent styling
- Test edge cases
- Review accessibility

This guide provides a foundation for consistent development practices across the project.
