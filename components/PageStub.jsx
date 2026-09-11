export default function PageStub({ title, note }) {
  return (
    <div className="panel p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-sm mut">
        {note || 'This page is stubbed — its full content is being ported from the static site.'}
      </p>
    </div>
  );
}
