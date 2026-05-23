import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import type { FileEntry } from '@/types';
import {
  FolderOpen,
  FileText,
  ChevronRight,
  Home,
  ArrowUp,
  Upload,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit3,
  Download,
  FileArchive,
  ArchiveRestore,
  X,
  Check,
  RefreshCw,
  AlertTriangle,
  Search,
  Grid3X3,
  List,
} from 'lucide-react';

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FilesPage() {
  const { emit, connected } = useSocket();
  const [currentPath, setCurrentPath] = useState(() => {
    return '/workspaces';
  });
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editPath, setEditPath] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFile, setShowCreateFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setErrors([]);
    const response: any = await emit('file:list', currentPath);
    if (response?.success) {
      setFiles(response.files);
    } else if (response?.error) {
      setErrors([response.error]);
    }
    setLoading(false);
  }, [currentPath, emit, connected]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parent);
  };

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < filesList.length; i++) {
      formData.append('files', filesList[i]);
    }

    try {
      const response = await fetch(`/api/upload?path=${encodeURIComponent(currentPath)}`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        loadFiles();
      }
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (entry: FileEntry) => {
    if (!confirm(`Delete ${entry.name}?`)) return;
    const response: any = await emit('file:delete', entry.path);
    if (response?.success) {
      loadFiles();
      if (selectedFile?.path === entry.path) setSelectedFile(null);
    }
  };

  const handleRename = async (entry: FileEntry) => {
    if (!renameValue.trim() || renameValue === entry.name) {
      setRenaming(null);
      return;
    }
    const newPath = entry.path.replace(entry.name, renameValue);
    const response: any = await emit('file:rename', { oldPath: entry.path, newPath });
    if (response?.success) {
      loadFiles();
    }
    setRenaming(null);
    setRenameValue('');
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const folderPath = `${currentPath}/${newFolderName}`.replace(/\/+/g, '/');
    const response: any = await emit('file:mkdir', folderPath);
    if (response?.success) {
      loadFiles();
      setShowCreateFolder(false);
      setNewFolderName('');
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const filePath = `${currentPath}/${newFileName}`.replace(/\/+/g, '/');
    const response: any = await emit('file:write', { filePath, content: '' });
    if (response?.success) {
      loadFiles();
      setShowCreateFile(false);
      setNewFileName('');
    }
  };

  const handleEditFile = async (entry: FileEntry) => {
    const response: any = await emit('file:read', entry.path);
    if (response?.success) {
      setEditContent(response.content);
      setEditPath(entry.path);
      setShowEditor(true);
    }
  };

  const handleSaveFile = async () => {
    const response: any = await emit('file:write', { filePath: editPath, content: editContent });
    if (response?.success) {
      setShowEditor(false);
      loadFiles();
    }
  };

  const handleCompress = async (entry: FileEntry) => {
    const zipPath = `${entry.path}.zip`;
    const response: any = await emit('file:compress', { sourcePath: entry.path, zipPath });
    if (response?.success) {
      loadFiles();
    }
  };

  const handleExtract = async (entry: FileEntry) => {
    if (!entry.name.toLowerCase().endsWith('.zip')) {
      alert('Only ZIP files can be extracted');
      return;
    }
    const destPath = entry.path.replace(/\.zip$/i, '');
    const confirmed = confirm(`Extract ${entry.name} to ${destPath.split('/').pop()}?`);
    if (!confirmed) return;
    
    const response: any = await emit('file:extract', { zipPath: entry.path, destPath });
    if (response?.success) {
      alert('Extract successful!');
      loadFiles();
    } else {
      alert('Extract failed: ' + (response?.error || 'Unknown error'));
    }
  };

  const handleDownload = (entry: FileEntry) => {
    window.open(`/api/download?path=${encodeURIComponent(entry.path)}`, '_blank');
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  const pathParts = currentPath.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'root', path: '/' }, ...pathParts.map((part, i) => ({
    name: part,
    path: '/' + pathParts.slice(0, i + 1).join('/'),
  }))];

  if (showEditor) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#d6dbe4]">Edit File</h1>
            <p className="text-xs text-[#8b93a7] font-mono mt-0.5">{editPath}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEditor(false)} className="btn-secondary">
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
            <button onClick={handleSaveFile} className="btn-primary">
              <Check className="w-4 h-4 inline mr-1" /> Save
            </button>
          </div>
        </div>
        <textarea
          className="w-full h-[70vh] bg-[#0f1115] border border-[#262c36] rounded p-4 text-sm font-mono text-[#d6dbe4] resize-none focus:outline-none focus:border-[#4fa3ff]"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-[#d6dbe4]">Files</h1>
          <p className="text-xs text-[#8b93a7] font-mono mt-0.5">{files.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className="btn-secondary p-2">
            {viewMode === 'list' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </button>
          <button onClick={loadFiles} className="btn-secondary p-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> {uploading ? '...' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <ChevronRight className="w-3 h-3 text-[#8b93a7]" />}
            <button
              onClick={() => navigateTo(crumb.path)}
              className={`hover:text-[#4fa3ff] transition-colors ${
                i === breadcrumbs.length - 1 ? 'text-[#d6dbe4] font-medium' : 'text-[#8b93a7]'
              }`}
            >
              {i === 0 ? <Home className="w-3.5 h-3.5" /> : crumb.name}
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b93a7]" />
        <input
          type="text"
          className="input-field w-full pl-9"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {errors.length > 0 && (
        <div className="p-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff6b6b]" />
            <span className="text-xs text-[#ff6b6b]">{errors[0]}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {currentPath !== '/' && (
          <button onClick={navigateUp} className="btn-secondary flex items-center gap-1.5 text-xs">
            <ArrowUp className="w-3 h-3" /> Up
          </button>
        )}
        <button onClick={() => setShowCreateFolder(!showCreateFolder)} className="btn-secondary flex items-center gap-1.5 text-xs">
          <FolderPlus className="w-3 h-3" /> New Folder
        </button>
        <button onClick={() => setShowCreateFile(!showCreateFile)} className="btn-secondary flex items-center gap-1.5 text-xs">
          <FilePlus className="w-3 h-3" /> New File
        </button>
      </div>

      {showCreateFolder && (
        <div className="flex items-center gap-2 animate-slide-up">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <button onClick={handleCreateFolder} className="btn-primary">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }} className="btn-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showCreateFile && (
        <div className="flex items-center gap-2 animate-slide-up">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="File name"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            autoFocus
          />
          <button onClick={handleCreateFile} className="btn-primary">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowCreateFile(false); setNewFileName(''); }} className="btn-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="panel">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#8b93a7]">Loading files...</div>
        ) : sortedFiles.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-8 h-8 text-[#262c36] mx-auto mb-2" />
            <p className="text-sm text-[#8b93a7]">Empty directory</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-[#262c36]">
            {sortedFiles.map((entry) => (
              <div
                key={entry.path}
                className={`flex items-center gap-3 px-4 py-2.5 hover-row transition-colors ${
                  selectedFile?.path === entry.path ? 'bg-[#4fa3ff]/5' : ''
                }`}
                onClick={() => setSelectedFile(selectedFile?.path === entry.path ? null : entry)}
              >
                {entry.type === 'directory' ? (
                  <FolderOpen className="w-4 h-4 text-[#e5a044] flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-[#4fa3ff] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {renaming === entry.path ? (
                    <input
                      type="text"
                      className="input-field w-full max-w-[200px]"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(entry);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      onBlur={() => handleRename(entry)}
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (entry.type === 'directory') {
                          navigateTo(entry.path);
                        }
                      }}
                      className={`text-sm truncate block ${
                        entry.type === 'directory' ? 'text-[#e5a044] hover:underline' : 'text-[#d6dbe4]'
                      }`}
                    >
                      {entry.name}
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[#8b93a7] font-mono hidden sm:block w-16 text-right">
                  {formatSize(entry.size)}
                </span>
                <span className="text-[10px] text-[#8b93a7] font-mono hidden lg:block w-28 text-right">
                  {formatDate(entry.modified)}
                </span>
                {selectedFile?.path === entry.path && (
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {entry.type === 'file' && entry.name.toLowerCase().endsWith('.zip') && (
                      <button
                        onClick={() => handleExtract(entry)}
                        className="p-1.5 hover:bg-[#57c27e]/10 rounded text-[#57c27e]"
                        title="Extract ZIP"
                      >
                        <ArchiveRestore className="w-3 h-3" />
                      </button>
                    )}
                    {entry.type === 'file' && (
                      <>
                        <button
                          onClick={() => handleEditFile(entry)}
                          className="p-1.5 hover:bg-[#4fa3ff]/10 rounded text-[#4fa3ff]"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDownload(entry)}
                          className="p-1.5 hover:bg-[#57c27e]/10 rounded text-[#57c27e]"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleCompress(entry)}
                      className="p-1.5 hover:bg-[#e5a044]/10 rounded text-[#e5a044]"
                      title="Compress to ZIP"
                    >
                      <FileArchive className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => { setRenaming(entry.path); setRenameValue(entry.name); }}
                      className="p-1.5 hover:bg-[#8b93a7]/10 rounded text-[#8b93a7]"
                      title="Rename"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-1.5 hover:bg-[#ff6b6b]/10 rounded text-[#ff6b6b]"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
            {sortedFiles.map((entry) => (
              <button
                key={entry.path}
                onClick={() => {
                  if (entry.type === 'directory') {
                    navigateTo(entry.path);
                  } else {
                    setSelectedFile(selectedFile?.path === entry.path ? null : entry);
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded hover:bg-[#1a1f2a] transition-colors text-center ${
                  selectedFile?.path === entry.path ? 'bg-[#4fa3ff]/5 border border-[#4fa3ff]/30' : ''
                }`}
              >
                {entry.type === 'directory' ? (
                  <FolderOpen className="w-8 h-8 text-[#e5a044]" />
                ) : (
                  <FileText className="w-8 h-8 text-[#4fa3ff]" />
                )}
                <span className="text-xs text-[#d6dbe4] truncate w-full">{entry.name}</span>
                <span className="text-[10px] text-[#8b93a7] font-mono">{formatSize(entry.size)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}