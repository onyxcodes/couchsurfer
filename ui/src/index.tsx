import React from 'react';
import { createRoot } from 'react-dom/client';

import { Provider } from 'react-redux';
import App from './views/App';
import { store } from 'store';

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode>
  <Provider store={store}>
    <App />
  </Provider>
</React.StrictMode>);