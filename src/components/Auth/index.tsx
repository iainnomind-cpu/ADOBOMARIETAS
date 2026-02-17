import { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function Auth() {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    if (mode === 'login') {
        return <Login onToggleMode={() => setMode('register')} />;
    }

    return <Register onToggleMode={() => setMode('login')} />;
}
