import FileUpload from "../components/FileUpload";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-gray-700">
      <FileUpload />
    </main>
  );
}
