import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Camera, Loader2, LogOut, Mail, UserRound } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { IMAGE_TYPES, MAX_AVATAR_BYTES, compressImage, dataUrlBytes } from '../utils/files';
import { formatBytes, formatMemberSince } from '../utils/format';
import { getFieldErrors } from '../lib/axios';

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2.5 text-fg-muted">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
      <span className="truncate text-right text-fg">{children}</span>
    </div>
  );
}

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.authUser);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isUpdating = useAuthStore((s) => s.isUpdatingProfile);
  const logout = useAuthStore((s) => s.logout);

  const [fullName, setFullName] = useState(authUser?.fullName ?? '');
  const [nameError, setNameError] = useState();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error('Please choose a PNG, JPEG, WebP or GIF image.');
      return;
    }

    setUploading(true);
    try {
      const { dataUrl } = await compressImage(file, { maxSize: 512, quality: 0.85 });
      if (dataUrlBytes(dataUrl) > MAX_AVATAR_BYTES) {
        toast.error(`Profile pictures must be under ${formatBytes(MAX_AVATAR_BYTES)}.`);
        return;
      }
      setPreview(dataUrl);
      const { ok } = await updateProfile({ profilePic: dataUrl });
      if (!ok) setPreview(null);
    } catch {
      toast.error('Could not read that image.');
    } finally {
      setUploading(false);
    }
  };

  const trimmed = fullName.trim();
  const nameChanged = trimmed !== authUser?.fullName;

  const onSaveName = async (e) => {
    e.preventDefault();
    if (trimmed.length < 2 || trimmed.length > 50) {
      setNameError('Name must be 2–50 characters');
      return;
    }
    const { ok, error } = await updateProfile({ fullName: trimmed });
    if (!ok) setNameError(getFieldErrors(error).fullName);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Profile" description="How other people see you on PeerConnect" />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
          {/* Identity */}
          <section className="flex animate-rise-in flex-col items-center rounded-xl border border-line bg-surface-1 px-6 py-8 text-center">
            <div className="relative">
              <Avatar user={{ ...authUser, profilePic: preview ?? authUser?.profilePic }} size="xl" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile picture"
                className="absolute right-0 bottom-0 inline-flex size-9 items-center justify-center rounded-full border-2 border-surface-1 bg-primary text-primary-content transition-colors hover:bg-primary-hover disabled:opacity-70"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              </button>
              <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" onChange={onPickImage} tabIndex={-1} />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">{authUser?.fullName}</h2>
            <p className="text-fg-muted">{authUser?.email}</p>
            <p className="mt-3 text-meta text-fg-subtle">
              {uploading ? 'Uploading…' : 'Click the camera to change your photo. Images are resized before upload.'}
            </p>
          </section>

          {/* Edit name */}
          <section className="rounded-xl border border-line bg-surface-1">
            <header className="border-b border-line px-5 py-4">
              <h3 className="font-semibold">Display name</h3>
              <p className="text-meta text-fg-subtle">Shown in contact lists and chat headers.</p>
            </header>
            <form onSubmit={onSaveName} className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-start">
              <Input
                className="flex-1"
                aria-label="Full name"
                icon={UserRound}
                value={fullName}
                maxLength={50}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setNameError(undefined);
                }}
                error={nameError}
              />
              <Button type="submit" disabled={!nameChanged} loading={isUpdating && !uploading} className="h-10 sm:w-28">
                Save
              </Button>
            </form>
          </section>

          {/* Account */}
          <section className="rounded-xl border border-line bg-surface-1">
            <header className="border-b border-line px-5 py-4">
              <h3 className="font-semibold">Account</h3>
            </header>
            <div className="divide-y divide-line px-5">
              <InfoRow icon={Mail} label="Email">
                {authUser?.email}
              </InfoRow>
              <InfoRow icon={CalendarDays} label="Member since">
                {authUser?.createdAt ? formatMemberSince(authUser.createdAt) : '—'}
              </InfoRow>
              <InfoRow icon={UserRound} label="Status">
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-full bg-success" aria-hidden="true" />
                  Active
                </span>
              </InfoRow>
            </div>
          </section>

          <Button variant="secondary" onClick={logout} className="w-full sm:w-auto">
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
