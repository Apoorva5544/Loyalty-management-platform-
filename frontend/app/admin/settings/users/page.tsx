export default function UsersPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block">
                            ← Back to program
                        </a>
                        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    </div>
                </div>
            </div>
            <div className="p-8">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <p className="text-gray-500">User management coming soon...</p>
                </div>
            </div>
        </div>
    );
}
