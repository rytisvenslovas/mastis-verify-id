import React, { useMemo } from 'react';
import Modal from './Modal';

const isHttpUrl = (str) => {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const isPdfUrl = (url) =>
  typeof url === 'string' &&
  (/\.(pdf)(\?|#|$)/i.test(url) || /\/raw\/upload\//i.test(url));

const SafeExternalLink = ({ href, children, className, 'aria-label': ariaLabel }) => {
  if (!isHttpUrl(href)) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      download
    >
      {children}
    </a>
  );
};

const ImageWithFallback = ({ src, alt, className }) => {
  const [broken, setBroken] = React.useState(false);

  if (!isHttpUrl(src)) {
    return (
      <div className="text-xs text-red-600">
        Invalid image URL
      </div>
    );
  }

  if (broken) {
    return (
      <div className="text-xs text-red-600">
        Couldn’t load image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};

const DocumentPreview = ({ url, alt }) => {
  if (!url || !isHttpUrl(url)) {
    return <p className="text-xs text-gray-500">No document provided.</p>;
  }

  const pdf = isPdfUrl(url);

  if (pdf) {
    return (
      <div className="space-y-2">
        <SafeExternalLink
          href={url}
          aria-label={`Open PDF: ${alt || 'document'}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          📄 Download / View PDF
        </SafeExternalLink>
        <p className="text-xs text-gray-500">
          Opens the PDF in a new tab.
        </p>
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={url}
      alt={alt || 'uploaded document'}
      className="max-w-full h-auto rounded border"
    />
  );
};

const LabeledSection = ({ title, children }) => (
  <div className="border-b pb-4">
    <h4 className="font-semibold mb-2">{title}</h4>
    {children}
  </div>
);

const ViewSubmissionModal = ({ isOpen, onClose, submission }) => {
  // Defensive read
  const data = submission?.submission?.[0] ?? null;

  const displayName = useMemo(() => {
    const first = submission?.name?.trim() || '';
    const last = submission?.surname?.trim() || '';
    const full = `${first} ${last}`.trim();
    return full || 'Unknown Applicant';
  }, [submission?.name, submission?.surname]);

  if (!data) {
    return null;
  }

  // Format date safely
  const submittedAt = (() => {
    if (!data.submitted_at) return null;
    const d = new Date(data.submitted_at);
    return isNaN(d.getTime()) ? null : d.toLocaleString();
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">
          Uploaded Documents — {displayName}
        </h3>

        {data.id_picture ? (
          <LabeledSection title="ID Document">
            {data.id_type && (
              <p className="text-sm text-gray-600 mb-2">Type: {data.id_type}</p>
            )}
            <DocumentPreview url={data.id_picture} alt="ID Document" />
          </LabeledSection>
        ) : null}

        {data.selfie ? (
          <LabeledSection title="Selfie">
            <ImageWithFallback
              src={data.selfie}
              alt={`Selfie — ${displayName}`}
              className="max-w-full h-auto rounded border"
            />
          </LabeledSection>
        ) : null}

        {data.address_proof_picture ? (
          <LabeledSection title="Address Proof">
            {data.address_proof_type && (
              <p className="text-sm text-gray-600 mb-2">
                Type: {data.address_proof_type}
              </p>
            )}
            <DocumentPreview
              url={data.address_proof_picture}
              alt="Address Proof"
            />
          </LabeledSection>
        ) : null}

        <div className="mt-4 bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-600">
            Status:{' '}
            <span className="font-semibold">
              {data.status || 'Unknown'}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Submitted:{' '}
            {submittedAt ? submittedAt : '—'}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ViewSubmissionModal;