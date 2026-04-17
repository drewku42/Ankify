export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <h1 className="login-page__title">Ankify</h1>
        <p className="login-page__subtitle">
          Turn lecture slides into Anki decks with AI
        </p>
        <button className="login-page__button" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
