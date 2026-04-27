type UserActionIconProps = {
  className?: string;
};

export function ViewIcon({ className = "h-4 w-4" }: UserActionIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5c5.5 0 9.27 5.11 9.43 5.33l.57.8-.57.8C21.27 12.15 17.5 17.27 12 17.27S2.73 12.15 2.57 11.93L2 11.13l.57-.8C2.73 10.11 6.5 5 12 5Zm0 2c-3.62 0-6.54 2.96-7.31 4.13.77 1.17 3.69 4.14 7.31 4.14s6.54-2.97 7.31-4.14C18.54 9.96 15.62 7 12 7Zm0 1.5A2.63 2.63 0 1 1 9.38 11 2.63 2.63 0 0 1 12 8.5Z" fill="currentColor" />
    </svg>
  );
}

export function EditIcon({ className = "h-4 w-4" }: UserActionIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="m4 15.75 9.81-9.81 4.25 4.25L8.25 20H4v-4.25Zm12.95-10.7a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-.83.83-4.25-4.25.83-.83Z" fill="currentColor" />
    </svg>
  );
}

export function DeleteIcon({ className = "h-4 w-4" }: UserActionIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z" fill="currentColor" />
    </svg>
  );
}

export function RefreshIcon({ className = "h-4 w-4" }: UserActionIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5a7 7 0 0 1 6.05 3.48V6H20v6h-6V10h2.56A5 5 0 1 0 17 15h2a7 7 0 1 1-7-10Z" fill="currentColor" />
    </svg>
  );
}
