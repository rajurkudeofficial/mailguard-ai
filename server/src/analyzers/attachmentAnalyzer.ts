/**
 * MailGuard AI — Attachment Analyzer
 * Detects dangerous attachment types, executable files,
 * double extensions, and macro-enabled documents.
 */

export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
  isDangerous: boolean;
  isExecutable: boolean;
  hasMacro: boolean;
  hasDoubleExtension: boolean;
  riskLevel: 'safe' | 'suspicious' | 'malicious';
}

export interface AttachmentSignals {
  hasAttachments: boolean;
  attachmentCount: number;
  suspiciousAttachment: boolean;
  executableAttachment: boolean;
  attachmentData: AttachmentInfo[];
  evidence: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
}

const EXECUTABLE_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe', '.js',
  '.jse', '.wsf', '.wsh', '.ps1', '.ps2', '.psm1', '.reg', '.msi', '.msp',
  '.hta', '.cpl', '.msc', '.jar', '.py', '.rb', '.sh', '.bash', '.dll',
]);

const MACRO_MIME_TYPES = new Set([
  'application/vnd.ms-excel.sheet.macroEnabled.12',         // .xlsm
  'application/vnd.ms-excel.template.macroEnabled.12',      // .xltm
  'application/vnd.ms-word.document.macroEnabled.12',       // .docm
  'application/vnd.ms-word.template.macroEnabled.12',       // .dotm
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12', // .pptm
  'application/vnd.ms-excel.addin.macroEnabled.12',
]);

const SUSPICIOUS_EXTENSIONS = new Set([
  '.xlsm', '.docm', '.pptm', '.xlsb', '.xlam', '.dotm', '.xltm',
  '.rar', '.7z', '.iso', '.img', '.dmg', '.lnk',
]);

const DANGEROUS_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-executable',
  'application/x-msdos-program',
  'application/x-sh',
  'text/x-shellscript',
]);

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

function hasDoubleExtension(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length < 3) return false;
  const secondLast = `.${parts[parts.length - 2].toLowerCase()}`;
  return EXECUTABLE_EXTENSIONS.has(secondLast) || SUSPICIOUS_EXTENSIONS.has(secondLast);
}

export function analyzeAttachments(
  attachments: Array<{ filename: string; mimeType: string; size: number }>
): AttachmentSignals {
  const evidence: AttachmentSignals['evidence'] = [];

  if (!attachments || attachments.length === 0) {
    return {
      hasAttachments: false, attachmentCount: 0, suspiciousAttachment: false,
      executableAttachment: false, attachmentData: [], evidence,
    };
  }

  const attachmentData: AttachmentInfo[] = [];
  let suspiciousAttachment = false;
  let executableAttachment = false;

  for (const att of attachments) {
    const ext = getExtension(att.filename);
    const isExecutable = EXECUTABLE_EXTENSIONS.has(ext) || DANGEROUS_MIME_TYPES.has(att.mimeType);
    const hasMacro = MACRO_MIME_TYPES.has(att.mimeType) || ['.xlsm', '.docm', '.pptm', '.dotm', '.xltm'].includes(ext);
    const hasDoubleExt = hasDoubleExtension(att.filename);
    const isDangerous = isExecutable || hasDoubleExt;
    const isSuspicious = hasMacro || SUSPICIOUS_EXTENSIONS.has(ext);

    let riskLevel: AttachmentInfo['riskLevel'] = 'safe';
    if (isDangerous) riskLevel = 'malicious';
    else if (isSuspicious) riskLevel = 'suspicious';

    attachmentData.push({
      filename: att.filename, mimeType: att.mimeType, size: att.size,
      isDangerous, isExecutable, hasMacro, hasDoubleExtension: hasDoubleExt, riskLevel,
    });

    if (isExecutable) {
      executableAttachment = true;
      suspiciousAttachment = true;
      evidence.push({
        label: 'Executable Attachment',
        detail: `File "${att.filename}" (${att.mimeType}) is an executable or script — extreme danger`,
        severity: 'critical',
      });
    } else if (hasDoubleExt) {
      suspiciousAttachment = true;
      evidence.push({
        label: 'Double Extension (Disguised File)',
        detail: `File "${att.filename}" uses a double extension to disguise its true type`,
        severity: 'critical',
      });
    } else if (hasMacro) {
      suspiciousAttachment = true;
      evidence.push({
        label: 'Macro-Enabled Document',
        detail: `File "${att.filename}" is macro-enabled — can execute malicious code`,
        severity: 'high',
      });
    } else if (isSuspicious) {
      suspiciousAttachment = true;
      evidence.push({
        label: 'Suspicious Attachment Type',
        detail: `File "${att.filename}" (${ext}) is a potentially risky file type`,
        severity: 'medium',
      });
    }
  }

  return {
    hasAttachments: true,
    attachmentCount: attachments.length,
    suspiciousAttachment,
    executableAttachment,
    attachmentData,
    evidence,
  };
}
