import {
  BasketDefinition,
  BasketItem,
  Grade,
  MatchingPair,
  Question,
  QuestionSource,
  QuestionType,
  ROUNDS,
  RoundLevel,
  SUBJECT_ID_CODE,
  SubjectCode,
} from '../types/vioedu';

export interface ParsedIdMeta {
  grade: Grade | null;
  round: RoundLevel | null;
  subject: SubjectCode | null;
  type: QuestionType | null;
  sequence: string | null;
}

const VALID_TYPES: QuestionType[] = ['tn', 'noi', 'dt', 'sx', 'chon'];

const ID_SUBJECT_MAP: Record<string, SubjectCode> = {
  t: 'toan',
  tv: 'tieng_viet',
  tta: 'toan_tieng_anh',
  ta: 'tieng_anh',
};

export function parseQuestionId(rawId: string): ParsedIdMeta {
  const cleaned = (rawId || '').trim().toLowerCase();

  // Primary pattern: l1_c1_t__tn_001 (also accepts single underscore between subject & type)
  const newFormatMatch = cleaned.match(
    /^l([1-9])[_-]c([1-5])[_-](tta|tv|ta|t)[_-]{1,2}(tn|noi|dt|sx|chon)(?:[_-](\d+))?$/i
  );
  if (newFormatMatch) {
    return {
      grade: Number(newFormatMatch[1]) as Grade,
      round: Number(newFormatMatch[2]) as RoundLevel,
      subject: ID_SUBJECT_MAP[newFormatMatch[3].toLowerCase()] ?? null,
      type: newFormatMatch[4].toLowerCase() as QuestionType,
      sequence: newFormatMatch[5] ?? null,
    };
  }

  // Legacy pattern fallback: l4_c1_tn_0001
  const legacyMatch = cleaned.match(
    /l([1-9])[_-]?c([1-5])[_-]?(tn|noi|dt|sx|chon)(?:[_-]?(\d+))?/i
  );
  if (legacyMatch) {
    return {
      grade: Number(legacyMatch[1]) as Grade,
      round: Number(legacyMatch[2]) as RoundLevel,
      subject: null,
      type: legacyMatch[3].toLowerCase() as QuestionType,
      sequence: legacyMatch[4] ?? null,
    };
  }

  // Partial fallback
  const gradeMatch = cleaned.match(/(?:^|[_-])(?:l|lop|grade|g)([1-9])(?:$|[_-])/i);
  const roundMatch = cleaned.match(/(?:^|[_-])(?:c|cap|vong|round|r)([1-5])(?:$|[_-])/i);
  const subjMatch = cleaned.match(/(?:^|[_-])(tta|tv|ta|t)(?:$|[_-])/i);
  const typeMatch = cleaned.match(/(?:^|[_-])(tn|noi|dt|sx|chon)(?:$|[_-])/i);

  return {
    grade: gradeMatch ? (Number(gradeMatch[1]) as Grade) : null,
    round: roundMatch ? (Number(roundMatch[1]) as RoundLevel) : null,
    subject: subjMatch ? (ID_SUBJECT_MAP[subjMatch[1].toLowerCase()] ?? null) : null,
    type: typeMatch ? (typeMatch[1].toLowerCase() as QuestionType) : null,
    sequence: null,
  };
}

export function inferMetaFromFilename(fileName: string): {
  grade: Grade | null;
  round: RoundLevel | null;
  subject: SubjectCode | null;
} {
  const lower = fileName.toLowerCase();
  const gradeMatch = lower.match(/(?:^|[^a-z0-9])(?:l|lop|grade|class|k)[_\-\s]?([1-9])(?:$|[^0-9])/i);
  const roundMatch = lower.match(/(?:^|[^a-z0-9])(?:c|cap|vong|round|v)[_\-\s]?([1-5])(?:$|[^0-9])/i);

  let round: RoundLevel | null = roundMatch ? (Number(roundMatch[1]) as RoundLevel) : null;
  if (!round) {
    if (lower.includes('khoi_dong') || lower.includes('khoidong') || lower.includes('loai')) round = 1;
    else if (lower.includes('tang_toc') || lower.includes('tangtoc') || lower.includes('truong')) round = 2;
    else if (lower.includes('tranh_tai') || lower.includes('tranhtai') || lower.includes('phuong')) round = 3;
    else if (lower.includes('sieu_tri_tue') || lower.includes('tinh')) round = 4;
    else if (lower.includes('chinh_phuc') || lower.includes('quoc_gia') || lower.includes('quocgia')) round = 5;
  }

  let subject: SubjectCode | null = null;
  if (
    lower.includes('toan_ta') ||
    lower.includes('toan_tieng_anh') ||
    lower.includes('math_en') ||
    lower.includes('english_math') ||
    /(?:^|[_-])tta(?:$|[_.-])/.test(lower)
  ) {
    subject = 'toan_tieng_anh';
  } else if (
    lower.includes('tieng_anh') ||
    lower.includes('english') ||
    /(?:^|[_-])(?:ta|en)(?:$|[_.-])/.test(lower)
  ) {
    subject = 'tieng_anh';
  } else if (
    lower.includes('tieng_viet') ||
    lower.includes('vietnamese') ||
    /(?:^|[_-])tv(?:$|[_.-])/.test(lower)
  ) {
    subject = 'tieng_viet';
  } else if (
    lower.includes('toan') ||
    lower.includes('math') ||
    /(?:^|[_-])t(?:$|[_.-])/.test(lower)
  ) {
    subject = 'toan';
  }

  return {
    grade: gradeMatch ? (Number(gradeMatch[1]) as Grade) : null,
    round,
    subject,
  };
}

export function normalizeSubject(raw: unknown, fallback?: SubjectCode | null): SubjectCode {
  if (typeof raw === 'string') {
    const s = raw
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');

    if (
      s === 'tta' ||
      s.includes('toan bang tieng anh') ||
      s.includes('toan tieng anh') ||
      s === 'toan_tieng_anh' ||
      s === 'toan_ta' ||
      s.includes('math in english') ||
      s.includes('math_en')
    ) {
      return 'toan_tieng_anh';
    }
    if (s === 'tv' || s.includes('tieng viet') || s === 'tieng_viet' || s.includes('vietnamese')) {
      return 'tieng_viet';
    }
    if (s === 'ta' || s === 'en' || s.includes('tieng anh') || s === 'tieng_anh' || s.includes('english')) {
      return 'tieng_anh';
    }
    if (s === 't' || s.includes('toan') || s.includes('math')) {
      return 'toan';
    }
  }
  return fallback || 'toan';
}

function normalizeQuestionType(raw: unknown, record: Record<string, unknown>, idType: QuestionType | null): QuestionType {
  if (idType && VALID_TYPES.includes(idType)) return idType;
  if (typeof raw === 'string') {
    const t = raw.trim().toLowerCase();
    if (VALID_TYPES.includes(t as QuestionType)) return t as QuestionType;
    if (t.includes('trac_nghiem') || t.includes('multiple') || t.includes('mcq')) return 'tn';
    if (t.includes('noi') || t.includes('match')) return 'noi';
    if (t.includes('dien') || t.includes('fill') || t.includes('blank')) return 'dt';
    if (t.includes('sap_xep') || t.includes('order') || t.includes('sort')) return 'sx';
    if (t.includes('chon') || t.includes('gio') || t.includes('basket') || t.includes('bucket')) return 'chon';
  }
  // Structural inference
  if (Array.isArray(record.pairs) || Array.isArray(record.cap_noi)) return 'noi';
  if (Array.isArray(record.baskets) || Array.isArray(record.gio)) return 'chon';
  if (Array.isArray(record.correctOrder) || Array.isArray(record.thu_tu_dung)) return 'sx';
  if (Array.isArray(record.options) || Array.isArray(record.lua_chon) || Array.isArray(record.dap_an)) return 'tn';
  return 'dt';
}

function toGrade(val: unknown): Grade | null {
  const n = Number(val);
  if (Number.isInteger(n) && n >= 1 && n <= 9) return n as Grade;
  return null;
}

function toRound(val: unknown): RoundLevel | null {
  const n = Number(val);
  if (Number.isInteger(n) && n >= 1 && n <= 5) return n as RoundLevel;
  return null;
}

export interface ParseResult {
  questions: Question[];
  warnings: string[];
  detectedSlots: string[];
}

export function parseQuestionsPayload(
  rawJson: unknown,
  source: QuestionSource,
  sourceFile: string
): ParseResult {
  const warnings: string[] = [];
  const fileMeta = inferMetaFromFilename(sourceFile);

  let rawList: unknown[] = [];
  let rootGrade: Grade | null = fileMeta.grade;
  let rootRound: RoundLevel | null = fileMeta.round;
  let rootSubject: SubjectCode | null = fileMeta.subject;

  if (Array.isArray(rawJson)) {
    rawList = rawJson;
  } else if (rawJson && typeof rawJson === 'object') {
    const obj = rawJson as Record<string, unknown>;
    rootGrade = toGrade(obj.grade ?? obj.lop) ?? rootGrade;
    rootRound = toRound(obj.round ?? obj.cap ?? obj.vong) ?? rootRound;
    if (obj.subject ?? obj.mon) {
      rootSubject = normalizeSubject(obj.subject ?? obj.mon, rootSubject);
    }

    if (Array.isArray(obj.questions)) rawList = obj.questions;
    else if (Array.isArray(obj.cau_hoi)) rawList = obj.cau_hoi;
    else if (Array.isArray(obj.data)) rawList = obj.data;
    else if (Array.isArray(obj.items)) rawList = obj.items;
    else if (obj.id || obj.prompt || obj.question || obj.noi_dung) {
      rawList = [obj];
    } else {
      warnings.push(`File "${sourceFile}" không chứa mảng câu hỏi hợp lệ.`);
      return { questions: [], warnings, detectedSlots: [] };
    }
  } else {
    warnings.push(`File "${sourceFile}" không đúng định dạng JSON.`);
    return { questions: [], warnings, detectedSlots: [] };
  }

  const questions: Question[] = [];
  const slotSet = new Set<string>();

  rawList.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      warnings.push(`Mục #${index + 1} không phải đối tượng JSON hợp lệ.`);
      return;
    }

    const rec = item as Record<string, unknown>;
    const rawId = String(rec.id ?? rec.ma_cau ?? '').trim();
    const idMeta = parseQuestionId(rawId);

    const grade = idMeta.grade ?? toGrade(rec.grade ?? rec.lop) ?? rootGrade ?? 4;
    const round = idMeta.round ?? toRound(rec.round ?? rec.cap ?? rec.vong) ?? rootRound ?? 1;
    const type = normalizeQuestionType(rec.type ?? rec.loai ?? rec.loai_cau, rec, idMeta.type);
    const subject = idMeta.subject ?? normalizeSubject(rec.subject ?? rec.mon ?? rec.mon_hoc, rootSubject);

    const id =
      rawId ||
      `l${grade}_c${round}_${SUBJECT_ID_CODE[subject]}__${type}_${String(index + 1).padStart(3, '0')}`;

    const prompt = String(
      rec.prompt ?? rec.question ?? rec.noi_dung ?? rec.cau_hoi ?? rec.text ?? ''
    ).trim();

    if (!prompt) {
      warnings.push(`Câu "${id}" bị bỏ qua vì thiếu nội dung câu hỏi (prompt/question).`);
      return;
    }

    const topic = String(rec.topic ?? rec.chu_de ?? rec.chuyen_de ?? 'Kiến thức tổng hợp').trim();
    const explanation = String(
      rec.explanation ?? rec.giai_thich ?? rec.loi_giai ?? 'Xem lại đáp án chuẩn và quy tắc kiến thức của chủ đề này.'
    ).trim();

    const base: Question = {
      id,
      grade,
      round,
      type,
      subject,
      topic,
      prompt,
      explanation,
      source,
      sourceFile,
    };

    if (type === 'tn') {
      const rawOptions = (rec.options ?? rec.lua_chon ?? rec.choices ?? rec.dap_an) as unknown;
      if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
        warnings.push(`Câu trắc nghiệm "${id}" cần ít nhất 2 phương án trong "options".`);
        return;
      }
      const options = rawOptions.map((o) => String(o));
      let correctIndex = 0;

      if (typeof rec.correctIndex === 'number' && rec.correctIndex >= 0 && rec.correctIndex < options.length) {
        correctIndex = rec.correctIndex;
      } else if (typeof rec.correct_index === 'number' && rec.correct_index >= 0 && rec.correct_index < options.length) {
        correctIndex = rec.correct_index;
      } else {
        const rawAns = rec.answer ?? rec.correct ?? rec.ket_qua ?? rec.dap_an_dung;
        if (typeof rawAns === 'number' && rawAns >= 0 && rawAns < options.length) {
          correctIndex = rawAns;
        } else if (typeof rawAns === 'string') {
          const letterIdx = ['a', 'b', 'c', 'd', 'e', 'f'].indexOf(rawAns.trim().toLowerCase());
          const exactIdx = options.findIndex(
            (opt) => opt.trim().toLowerCase() === rawAns.trim().toLowerCase()
          );
          if (exactIdx >= 0) correctIndex = exactIdx;
          else if (letterIdx >= 0 && letterIdx < options.length) correctIndex = letterIdx;
        }
      }

      base.options = options;
      base.correctIndex = correctIndex;
    } else if (type === 'noi') {
      const rawPairs = (rec.pairs ?? rec.cap_noi ?? rec.matches) as unknown;
      if (!Array.isArray(rawPairs) || rawPairs.length < 2) {
        warnings.push(`Câu nối "${id}" cần ít nhất 2 cặp trong "pairs".`);
        return;
      }
      const pairs: MatchingPair[] = rawPairs
        .map((p, pIdx) => {
          if (Array.isArray(p) && p.length >= 2) {
            return { id: `p${pIdx + 1}`, left: String(p[0]), right: String(p[1]) };
          }
          if (p && typeof p === 'object') {
            const po = p as Record<string, unknown>;
            return {
              id: String(po.id ?? `p${pIdx + 1}`),
              left: String(po.left ?? po.ve_trai ?? po.a ?? ''),
              right: String(po.right ?? po.ve_phai ?? po.b ?? ''),
            };
          }
          return null;
        })
        .filter((x): x is MatchingPair => Boolean(x && x.left && x.right));

      if (pairs.length < 2) {
        warnings.push(`Câu nối "${id}" không đủ cặp trái/phải hợp lệ.`);
        return;
      }
      base.pairs = pairs;
    } else if (type === 'dt') {
      const rawAccepted = rec.acceptedAnswers ?? rec.dap_an_chap_nhan;
      const rawAns = rec.answer ?? rec.ket_qua ?? rec.dap_an_dung ?? rec.correct;
      let acceptedAnswers: string[][] = [];

      if (Array.isArray(rawAccepted) && rawAccepted.length > 0) {
        if (Array.isArray(rawAccepted[0])) {
          acceptedAnswers = (rawAccepted as unknown[][]).map((arr) =>
            arr.map((v) => String(v).trim()).filter(Boolean)
          );
        } else {
          acceptedAnswers = [(rawAccepted as unknown[]).map((v) => String(v).trim()).filter(Boolean)];
        }
      } else if (Array.isArray(rawAns)) {
        // Could be multiple accepted variants for 1 blank, or multiple blanks if prompt has multiple ___
        const blankMatches = prompt.match(/_{2,}/g);
        if (blankMatches && blankMatches.length > 1 && rawAns.length === blankMatches.length) {
          acceptedAnswers = rawAns.map((v) => [String(v).trim()]);
        } else {
          acceptedAnswers = [rawAns.map((v) => String(v).trim()).filter(Boolean)];
        }
      } else if (rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
        acceptedAnswers = [
          String(rawAns)
            .split('|')
            .map((v) => v.trim())
            .filter(Boolean),
        ];
      }

      if (acceptedAnswers.length === 0 || acceptedAnswers[0].length === 0) {
        warnings.push(`Câu điền từ "${id}" thiếu đáp án (answer / acceptedAnswers).`);
        return;
      }
      base.acceptedAnswers = acceptedAnswers;
      if (Array.isArray(rec.placeholders)) {
        base.placeholders = rec.placeholders.map(String);
      }
    } else if (type === 'sx') {
      const rawCorrect = (rec.correctOrder ?? rec.thu_tu_dung ?? rec.answer ?? rec.ket_qua) as unknown;
      const rawItems = (rec.orderItems ?? rec.items ?? rec.cac_muc) as unknown;

      if (!Array.isArray(rawCorrect) || rawCorrect.length < 2) {
        warnings.push(`Câu sắp xếp "${id}" cần mảng "correctOrder" ít nhất 2 phần tử.`);
        return;
      }
      const correctOrder = rawCorrect.map((x) => String(x));
      const orderItems =
        Array.isArray(rawItems) && rawItems.length === correctOrder.length
          ? rawItems.map((x) => String(x))
          : [...correctOrder];

      base.correctOrder = correctOrder;
      base.orderItems = orderItems;
      base.orderDirectionLabel = String(
        rec.orderDirectionLabel ?? rec.huong_dan ?? 'Thứ tự đúng từ trái sang phải'
      );
    } else if (type === 'chon') {
      const rawBaskets = (rec.baskets ?? rec.gio ?? rec.buckets) as unknown;
      const rawItems = (rec.basketItems ?? rec.items ?? rec.the ?? rec.phan_tu) as unknown;

      if (!Array.isArray(rawBaskets) || rawBaskets.length < 2 || !Array.isArray(rawItems) || rawItems.length < 2) {
        warnings.push(`Câu chọn giỏ "${id}" cần mảng "baskets" và "basketItems" (hoặc "items").`);
        return;
      }

      const baskets: BasketDefinition[] = rawBaskets.map((b, bIdx) => {
        if (typeof b === 'string') {
          return { id: `b${bIdx + 1}`, label: b };
        }
        const bo = b as Record<string, unknown>;
        return {
          id: String(bo.id ?? `b${bIdx + 1}`),
          label: String(bo.label ?? bo.name ?? bo.ten ?? `Giỏ ${bIdx + 1}`),
        };
      });

      const basketItems: BasketItem[] = rawItems
        .map((it, itIdx) => {
          const io = it as Record<string, unknown>;
          let targetBasketId = String(io.basketId ?? io.gio_id ?? io.bucket ?? io.basket ?? '');
          // Allow matching by basket label if basketId matches a label
          const matchedByLabel = baskets.find(
            (b) => b.label.toLowerCase() === targetBasketId.toLowerCase()
          );
          if (matchedByLabel) targetBasketId = matchedByLabel.id;
          if (!baskets.some((b) => b.id === targetBasketId)) {
            targetBasketId = baskets[0].id;
          }
          return {
            id: String(io.id ?? `item_${itIdx + 1}`),
            text: String(io.text ?? io.label ?? io.noi_dung ?? ''),
            basketId: targetBasketId,
          };
        })
        .filter((x) => x.text.length > 0);

      if (basketItems.length < 2) {
        warnings.push(`Câu chọn giỏ "${id}" không đủ phần tử hợp lệ.`);
        return;
      }

      base.baskets = baskets;
      base.basketItems = basketItems;
    }

    questions.push(base);
    const roundMeta = ROUNDS.find((r) => r.level === round);
    slotSet.add(`Lớp ${grade} · ${roundMeta?.roundName ?? `Cấp ${round}`}`);
  });

  return {
    questions,
    warnings,
    detectedSlots: Array.from(slotSet),
  };
}

export function generateSampleJsonTemplate(grade: Grade, round: RoundLevel): string {
  const prefix = `l${grade}_c${round}`;
  const sample = [
    {
      id: `${prefix}_t__tn_001`,
      subject: 'toan',
      topic: 'Phép tính số tự nhiên',
      prompt: `Giá trị của biểu thức 125 + 75 × 2 là bao nhiêu?`,
      options: ['400', '275', '250', '350'],
      correctIndex: 1,
      explanation: 'Thực hiện phép nhân trước, cộng sau: 75 × 2 = 150, sau đó 125 + 150 = 275.',
    },
    {
      id: `${prefix}_tv__noi_002`,
      subject: 'tieng_viet',
      topic: 'Từ đồng nghĩa và trái nghĩa',
      prompt: 'Nối mỗi từ ở cột trái với từ trái nghĩa tương ứng ở cột phải:',
      pairs: [
        { id: 'p1', left: 'Chăm chỉ', right: 'Lười biếng' },
        { id: 'p2', left: 'Dũng cảm', right: 'Hèn nhát' },
        { id: 'p3', left: 'Đoàn kết', right: 'Chia rẽ' },
      ],
      explanation: 'Chăm chỉ – Lười biếng; Dũng cảm – Hèn nhát; Đoàn kết – Chia rẽ là các cặp từ trái nghĩa.',
    },
    {
      id: `${prefix}_tta__dt_003`,
      subject: 'toan_tieng_anh',
      topic: 'Arithmetic in English',
      prompt: 'A rectangle has length 12 cm and width 5 cm. Its perimeter is ___ cm.',
      acceptedAnswers: [['34']],
      explanation: 'Perimeter = (length + width) × 2 = (12 + 5) × 2 = 34 cm.',
    },
    {
      id: `${prefix}_ta__sx_004`,
      subject: 'tieng_anh',
      topic: 'Sentence Structure',
      prompt: 'Sắp xếp các từ sau thành câu tiếng Anh hoàn chỉnh:',
      orderItems: ['every', 'reads', 'books', 'She', 'evening.'],
      correctOrder: ['She', 'reads', 'books', 'every', 'evening.'],
      orderDirectionLabel: 'Ghép thành câu đúng ngữ pháp',
      explanation: 'Cấu trúc thì hiện tại đơn: Chủ ngữ (She) + động từ (reads) + tân ngữ (books) + trạng ngữ thời gian (every evening.).',
    },
    {
      id: `${prefix}_t__chon_005`,
      subject: 'toan',
      topic: 'Số chẵn và số lẻ',
      prompt: 'Chọn từng số và xếp vào đúng giỏ Số chẵn hoặc Số lẻ:',
      baskets: [
        { id: 'chan', label: 'Giỏ Số chẵn' },
        { id: 'le', label: 'Giỏ Số lẻ' },
      ],
      basketItems: [
        { id: 'i1', text: '248', basketId: 'chan' },
        { id: 'i2', text: '135', basketId: 'le' },
        { id: 'i3', text: '902', basketId: 'chan' },
        { id: 'i4', text: '719', basketId: 'le' },
      ],
      explanation: 'Các số có chữ số tận cùng là 0, 2, 4, 6, 8 là số chẵn (248, 902); tận cùng là 1, 3, 5, 7, 9 là số lẻ (135, 719).',
    },
  ];
  return JSON.stringify(sample, null, 2);
}
