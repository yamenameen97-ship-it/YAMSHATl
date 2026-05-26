export default function ErrorState({ message }) {
  return (
    <div className="p-4 text-center">
      <h2>Error</h2>
      <p>{message}</p>
    </div>
  );
}