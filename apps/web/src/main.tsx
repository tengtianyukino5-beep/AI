import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import './styles/global.css';

const queryClient = new QueryClient();

class ClientErrorBoundary extends Component<{ children: ReactNode }, { message: string }> {
  state = { message: '' };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : '画面の読み込み中にエラーが発生しました。' };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Frontend render error', error, info.componentStack);
  }

  render() {
    if (this.state.message) {
      return (
        <main className="app-shell customer-shell">
          <section className="auth-grid">
            <div className="auth-hero">
              <p className="eyebrow">Recovery</p>
              <h1>画面を再読み込みしてください</h1>
              <p>一時的な表示エラーを検出しました。再読み込み後も続く場合は、ログイン情報をクリアしてもう一度お試しください。</p>
              <div className="disclosure">
                <span>{this.state.message}</span>
              </div>
            </div>
            <div className="auth-card">
              <button className="primary-button" type="button" onClick={() => window.location.reload()}>
                再読み込み
              </button>
              <button
                className="ghost-button full"
                type="button"
                onClick={() => {
                  localStorage.removeItem('customerToken');
                  localStorage.removeItem('adminToken');
                  window.location.href = '/';
                }}
              >
                ログイン情報をクリア
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClientErrorBoundary>
        <App />
      </ClientErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
