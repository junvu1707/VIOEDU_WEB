import {
  Grade,
  Question,
  QuestionType,
  RoundLevel,
  SUBJECT_ID_CODE,
  SubjectCode,
} from '../types/vioedu';
import { shuffleArray } from '../utils/examEngine';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(grade: Grade, round: RoundLevel, type: QuestionType, seq: number): string {
  return `l${grade}_c${round}_${type}_${String(seq).padStart(4, '0')}`;
}

function uniqueNumberOptions(correct: number, spreads: number[]): { options: string[]; correctIndex: number } {
  const set = new Set<number>([correct]);
  for (const s of spreads) {
    if (set.size >= 4) break;
    const candidate = correct + s;
    if (candidate !== correct && (correct >= 0 ? candidate >= 0 : true)) {
      set.add(candidate);
    }
  }
  let offset = 1;
  while (set.size < 4) {
    set.add(correct + offset * (offset % 2 === 0 ? 1 : -1) + 2);
    offset++;
  }
  const shuffled = shuffleArray(Array.from(set)).map(String);
  return {
    options: shuffled,
    correctIndex: shuffled.indexOf(String(correct)),
  };
}

// ============================================================
// 1. TOÁN (Vietnamese Math — scaled by Grade 1–9 & Round 1–5)
// ============================================================

function genMathTN(grade: Grade, round: RoundLevel, seq: number): Question {
  const scale = round;
  if (grade <= 2) {
    const a = randInt(5 * grade, 20 * grade + 8 * scale);
    const b = randInt(3, 15 * grade + 5 * scale);
    const isAdd = Math.random() > 0.4;
    const ans = isAdd ? a + b : Math.max(a, b) - Math.min(a, b);
    const expr = isAdd ? `${a} + ${b}` : `${Math.max(a, b)} − ${Math.min(a, b)}`;
    const { options, correctIndex } = uniqueNumberOptions(ans, [1, -1, 10, -2, 2]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan',
      topic: isAdd ? 'Phép cộng trong phạm vi 100' : 'Phép trừ không nhớ & có nhớ',
      prompt: `Kết quả của phép tính ${expr} bằng bao nhiêu?`,
      options,
      correctIndex,
      explanation: `Thực hiện tính từ hàng đơn vị đến hàng chục: ${expr} = ${ans}.`,
      source: 'sample',
    };
  }

  if (grade <= 5) {
    const mode = seq % 3;
    if (mode === 0) {
      const a = randInt(12, 30 + grade * 12 + scale * 8);
      const b = randInt(3, 6 + grade);
      const c = randInt(10, 40 + scale * 15);
      const ans = a * b + c;
      const { options, correctIndex } = uniqueNumberOptions(ans, [b, -b, 10, -10, a]);
      return {
        id: makeId(grade, round, 'tn', seq),
        grade,
        round,
        type: 'tn',
        subject: 'toan',
        topic: 'Thứ tự thực hiện phép tính',
        prompt: `Giá trị của biểu thức ${a} × ${b} + ${c} là:`,
        options,
        correctIndex,
        explanation: `Thực hiện phép nhân trước, phép cộng sau: ${a} × ${b} = ${a * b}, sau đó ${a * b} + ${c} = ${ans}.`,
        source: 'sample',
      };
    } else if (mode === 1) {
      const len = randInt(8, 18 + grade * 2 + scale * 2);
      const wid = randInt(4, len - 2);
      const askArea = seq % 2 === 0;
      const ans = askArea ? len * wid : (len + wid) * 2;
      const { options, correctIndex } = uniqueNumberOptions(ans, [len, -wid, 4, 2, -4]);
      return {
        id: makeId(grade, round, 'tn', seq),
        grade,
        round,
        type: 'tn',
        subject: 'toan',
        topic: 'Chu vi và diện tích hình chữ nhật',
        prompt: `Một hình chữ nhật có chiều dài ${len} cm và chiều rộng ${wid} cm. ${
          askArea ? 'Diện tích' : 'Chu vi'
        } hình chữ nhật đó là bao nhiêu?`,
        options: options.map((o) => `${o} ${askArea ? 'cm²' : 'cm'}`),
        correctIndex,
        explanation: askArea
          ? `Diện tích hình chữ nhật = dài × rộng = ${len} × ${wid} = ${ans} cm².`
          : `Chu vi hình chữ nhật = (dài + rộng) × 2 = (${len} + ${wid}) × 2 = ${ans} cm.`,
        source: 'sample',
      };
    } else {
      const x = randInt(6, 25 + scale * 5);
      const k = randInt(3, 9);
      const total = x * k;
      const { options, correctIndex } = uniqueNumberOptions(x, [1, -1, 2, -2, 3]);
      return {
        id: makeId(grade, round, 'tn', seq),
        grade,
        round,
        type: 'tn',
        subject: 'toan',
        topic: 'Tìm thành phần chưa biết (Tìm x)',
        prompt: `Tìm số tự nhiên x biết: x × ${k} = ${total}`,
        options,
        correctIndex,
        explanation: `Muốn tìm thừa số chưa biết ta lấy tích chia cho thừa số đã biết: x = ${total} : ${k} = ${x}.`,
        source: 'sample',
      };
    }
  }

  // Grades 6–9 (Middle school)
  const mode = seq % 3;
  if (mode === 0) {
    const x = randInt(-6 - scale, 12 + scale);
    const a = randInt(2, 5 + Math.floor(scale / 2));
    const b = randInt(3, 18);
    const rhs = a * x + b;
    const { options, correctIndex } = uniqueNumberOptions(x, [1, -1, 2, -2, 3]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan',
      topic: 'Phương trình bậc nhất một ẩn',
      prompt: `Nghiệm của phương trình ${a}x + ${b} = ${rhs} là:`,
      options: options.map((v) => `x = ${v}`),
      correctIndex,
      explanation: `Ta có ${a}x = ${rhs} − ${b} = ${rhs - b} ⇒ x = (${rhs - b}) : ${a} = ${x}.`,
      source: 'sample',
    };
  } else if (mode === 1) {
    const a = randInt(2, 6 + scale);
    const b = randInt(2, 5 + scale);
    const ans = a * a + b * b;
    const { options, correctIndex } = uniqueNumberOptions(ans, [2 * a * b, -2, 4, -4, 6]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan',
      topic: 'Lũy thừa và giá trị biểu thức',
      prompt: `Giá trị của biểu thức ${a}² + ${b}² là:`,
      options,
      correctIndex,
      explanation: `${a}² = ${a * a} và ${b}² = ${b * b}. Vậy ${a}² + ${b}² = ${a * a} + ${b * b} = ${ans}.`,
      source: 'sample',
    };
  } else {
    const base = randInt(6, 16 + scale * 2);
    const height = randInt(4, 14 + scale);
    const area = (base * height) / 2;
    const evenBase = base % 2 === 0 ? base : base + 1;
    const exactArea = (evenBase * height) / 2;
    const { options, correctIndex } = uniqueNumberOptions(exactArea, [evenBase, -height, 4, -4, 6]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan',
      topic: 'Hình học phẳng — Diện tích tam giác',
      prompt: `Một tam giác có cạnh đáy dài ${evenBase} cm và chiều cao tương ứng ${height} cm. Diện tích tam giác đó là:`,
      options: options.map((v) => `${v} cm²`),
      correctIndex,
      explanation: `Diện tích tam giác = (đáy × chiều cao) : 2 = (${evenBase} × ${height}) : 2 = ${exactArea} cm².`,
      source: 'sample',
    };
  }
}

function genMathDT(grade: Grade, round: RoundLevel, seq: number): Question {
  if (grade <= 2) {
    const a = randInt(10, 35 + grade * 15);
    const b = randInt(5, 25 + round * 4);
    const sum = a + b;
    return {
      id: makeId(grade, round, 'dt', seq),
      grade,
      round,
      type: 'dt',
      subject: 'toan',
      topic: 'Tính nhẩm nhanh',
      prompt: `Điền số thích hợp vào chỗ trống: ${a} + ${b} = ___`,
      acceptedAnswers: [[String(sum)]],
      explanation: `${a} + ${b} = ${sum}.`,
      source: 'sample',
    };
  }
  if (grade <= 5) {
    const side = randInt(5, 14 + grade * 2 + round);
    const askPerimeter = seq % 2 === 0;
    const ans = askPerimeter ? side * 4 : side * side;
    return {
      id: makeId(grade, round, 'dt', seq),
      grade,
      round,
      type: 'dt',
      subject: 'toan',
      topic: 'Hình vuông — Chu vi và diện tích',
      prompt: `Một hình vuông có cạnh ${side} cm. ${
        askPerimeter ? 'Chu vi' : 'Diện tích'
      } của hình vuông đó là ___ ${askPerimeter ? 'cm' : 'cm²'}.`,
      acceptedAnswers: [[String(ans)]],
      explanation: askPerimeter
        ? `Chu vi hình vuông = cạnh × 4 = ${side} × 4 = ${ans} cm.`
        : `Diện tích hình vuông = cạnh × cạnh = ${side} × ${side} = ${ans} cm².`,
      source: 'sample',
    };
  }
  // Grades 6–9
  const a = randInt(3, 9 + round);
  const b = randInt(2, 8 + round);
  const ans = a * b - (a + b);
  return {
    id: makeId(grade, round, 'dt', seq),
    grade,
    round,
    type: 'dt',
    subject: 'toan',
    topic: 'Biểu thức đại số',
    prompt: `Cho x = ${a} và y = ${b}. Giá trị của biểu thức P = x·y − (x + y) là ___.`,
    acceptedAnswers: [[String(ans)]],
    explanation: `Thay x = ${a}, y = ${b} vào P: P = ${a}·${b} − (${a} + ${b}) = ${a * b} − ${a + b} = ${ans}.`,
    source: 'sample',
  };
}

function genMathNoi(grade: Grade, round: RoundLevel, seq: number): Question {
  const usedAns = new Set<number>();
  const pairs: Array<{ id: string; left: string; right: string }> = [];
  let guard = 0;
  while (pairs.length < 3 && guard < 40) {
    guard++;
    let left = '';
    let ans = 0;
    if (grade <= 2) {
      const a = randInt(6, 25 + round * 5);
      const b = randInt(4, 18 + round * 3);
      ans = a + b;
      left = `${a} + ${b}`;
    } else if (grade <= 5) {
      const a = randInt(4, 12 + grade);
      const b = randInt(3, 9 + round);
      ans = a * b;
      left = `${a} × ${b}`;
    } else {
      const a = randInt(3, 10 + round);
      const b = randInt(2, 7);
      ans = a * a - b;
      left = `${a}² − ${b}`;
    }
    if (!usedAns.has(ans)) {
      usedAns.add(ans);
      pairs.push({ id: `p${pairs.length + 1}`, left, right: String(ans) });
    }
  }
  return {
    id: makeId(grade, round, 'noi', seq),
    grade,
    round,
    type: 'noi',
    subject: 'toan',
    topic: 'Ghép phép tính với kết quả đúng',
    prompt: 'Nối mỗi phép tính ở cột trái với kết quả đúng ở cột phải:',
    pairs,
    explanation: pairs.map((p) => `${p.left} = ${p.right}`).join('; '),
    source: 'sample',
  };
}

function genMathSX(grade: Grade, round: RoundLevel, seq: number): Question {
  const nums = new Set<number>();
  const minVal = grade >= 6 ? -20 - round * 5 : 10 * grade;
  const maxVal = grade >= 6 ? 35 + round * 10 : 60 * grade + round * 25;
  while (nums.size < 4) {
    nums.add(randInt(minVal, maxVal));
  }
  const sorted = Array.from(nums).sort((a, b) => a - b).map(String);
  let shuffled = shuffleArray(sorted);
  if (shuffled.every((v, i) => v === sorted[i])) {
    shuffled = [...sorted].reverse();
  }
  return {
    id: makeId(grade, round, 'sx', seq),
    grade,
    round,
    type: 'sx',
    subject: 'toan',
    topic: grade >= 6 ? 'So sánh số nguyên' : 'So sánh và sắp xếp số tự nhiên',
    prompt: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn:',
    orderItems: shuffled,
    correctOrder: sorted,
    orderDirectionLabel: 'Từ bé đến lớn',
    explanation: `Thứ tự tăng dần chính xác là: ${sorted.join(' < ')}.`,
    source: 'sample',
  };
}

function genMathChon(grade: Grade, round: RoundLevel, seq: number): Question {
  const useDiv3 = grade >= 4 && seq % 2 === 1;
  const baskets = useDiv3
    ? [
        { id: 'yes', label: 'Chia hết cho 3' },
        { id: 'no', label: 'Không chia hết cho 3' },
      ]
    : [
        { id: 'chan', label: 'Giỏ Số chẵn' },
        { id: 'le', label: 'Giỏ Số lẻ' },
      ];

  const items: Array<{ id: string; text: string; basketId: string }> = [];
  const used = new Set<number>();

  const pickVal = (matchCond: boolean) => {
    for (let tries = 0; tries < 50; tries++) {
      const n = randInt(12 + grade * 10, 90 + grade * 35 + round * 20);
      const ok = useDiv3 ? n % 3 === 0 : n % 2 === 0;
      if (ok === matchCond && !used.has(n)) {
        used.add(n);
        return n;
      }
    }
    return matchCond ? 24 : 25;
  };

  const n1 = pickVal(true);
  const n2 = pickVal(true);
  const n3 = pickVal(false);
  const n4 = pickVal(false);

  items.push(
    { id: 'i1', text: String(n1), basketId: baskets[0].id },
    { id: 'i2', text: String(n2), basketId: baskets[0].id },
    { id: 'i3', text: String(n3), basketId: baskets[1].id },
    { id: 'i4', text: String(n4), basketId: baskets[1].id }
  );

  return {
    id: makeId(grade, round, 'chon', seq),
    grade,
    round,
    type: 'chon',
    subject: 'toan',
    topic: useDiv3 ? 'Dấu hiệu chia hết cho 3' : 'Phân biệt số chẵn và số lẻ',
    prompt: useDiv3
      ? 'Phân loại các số sau vào đúng giỏ "Chia hết cho 3" hoặc "Không chia hết cho 3":'
      : 'Chọn từng số và xếp vào đúng giỏ Số chẵn hoặc Số lẻ:',
    baskets,
    basketItems: shuffleArray(items),
    explanation: useDiv3
      ? `Số chia hết cho 3 có tổng các chữ số chia hết cho 3 (${n1}, ${n2}). Còn lại (${n3}, ${n4}) không chia hết cho 3.`
      : `Số chẵn có tận cùng 0, 2, 4, 6, 8 (${n1}, ${n2}); số lẻ có tận cùng 1, 3, 5, 7, 9 (${n3}, ${n4}).`,
    source: 'sample',
  };
}

// ============================================================
// 2. TIẾNG VIỆT (Vietnamese Language & Literature)
// ============================================================

const TV_TN_BANK = [
  {
    minG: 1,
    maxG: 5,
    topic: 'Từ loại tiếng Việt',
    prompt: 'Trong các từ sau, từ nào là động từ chỉ hoạt động?',
    options: ['Chạy nhảy', 'Bàn ghế', 'Xanh biếc', 'Ngôi trường'],
    correctIndex: 0,
    explanation: '"Chạy nhảy" chỉ hoạt động của con người nên là động từ. "Bàn ghế, ngôi trường" là danh từ; "xanh biếc" là tính từ.',
  },
  {
    minG: 1,
    maxG: 5,
    topic: 'Chính tả tiếng Việt',
    prompt: 'Từ nào dưới đây viết đúng chính tả?',
    options: ['Giữ gìn', 'Dữ dìn', 'Giữ dìn', 'Rữ gìn'],
    correctIndex: 0,
    explanation: '"Giữ gìn" viết đúng chính tả bằng phụ âm đầu "gi".',
  },
  {
    minG: 2,
    maxG: 6,
    topic: 'Từ đồng nghĩa',
    prompt: 'Từ nào đồng nghĩa với từ "siêng năng"?',
    options: ['Chăm chỉ', 'Lười biếng', 'Nhanh nhẹn', 'Dũng cảm'],
    correctIndex: 0,
    explanation: '"Chăm chỉ" và "siêng năng" đều chỉ đức tính chịu khó, cần cù trong học tập và lao động.',
  },
  {
    minG: 3,
    maxG: 9,
    topic: 'Biện pháp tu từ',
    prompt: 'Câu văn "Mặt trời thức dậy sau rặng tre xanh" sử dụng biện pháp tu từ nào?',
    options: ['Nhân hóa', 'So sánh', 'Điệp ngữ', 'Nói quá'],
    correctIndex: 0,
    explanation: 'Tác giả dùng hoạt động của con người ("thức dậy") để miêu tả "mặt trời" — đây là biện pháp nhân hóa.',
  },
  {
    minG: 4,
    maxG: 9,
    topic: 'Thành ngữ & Tục ngữ',
    prompt: 'Thành ngữ nào khuyên chúng ta phải biết ơn người đi trước?',
    options: ['Uống nước nhớ nguồn', 'Lá lành đùm lá rách', 'Có công mài sắt có ngày nên kim', 'Một cây làm chẳng nên non'],
    correctIndex: 0,
    explanation: '"Uống nước nhớ nguồn" nhắc nhở lòng biết ơn đối với tổ tiên và những người tạo dựng thành quả.',
  },
  {
    minG: 5,
    maxG: 9,
    topic: 'Cấu tạo từ — Từ láy',
    prompt: 'Từ nào dưới đây là từ láy?',
    options: ['Lung linh', 'Tươi tốt', 'Sách vở', 'Quần áo'],
    correctIndex: 0,
    explanation: '"Lung linh" lặp lại âm đầu "l" và chỉ có nghĩa khi đi cùng nhau nên là từ láy; các từ còn lại là từ ghép.',
  },
  {
    minG: 6,
    maxG: 9,
    topic: 'Biện pháp tu từ — Ẩn dụ & Hoán dụ',
    prompt: 'Trong câu "Áo chàm đưa buổi phân li", hình ảnh "Áo chàm" sử dụng biện pháp tu từ nào?',
    options: ['Hoán dụ', 'So sánh', 'Nhân hóa', 'Điệp ngữ'],
    correctIndex: 0,
    explanation: '"Áo chàm" là trang phục đặc trưng dùng để chỉ người dân Việt Bắc — đây là hoán dụ lấy dấu hiệu của sự vật để gọi sự vật.',
  },
  {
    minG: 1,
    maxG: 9,
    topic: 'Từ trái nghĩa',
    prompt: 'Cặp từ nào dưới đây là cặp từ trái nghĩa?',
    options: ['Đoàn kết – Chia rẽ', 'Học tập – Rèn luyện', 'Mênh mông – Bát ngát', 'Sạch sẽ – Gọn gàng'],
    correctIndex: 0,
    explanation: '"Đoàn kết" và "Chia rẽ" có ý nghĩa đối lập nhau hoàn toàn nên là cặp từ trái nghĩa.',
  },
];

const TV_NOI_BANK = [
  {
    topic: 'Cặp từ trái nghĩa',
    prompt: 'Nối mỗi từ ở cột trái với từ trái nghĩa tương ứng ở cột phải:',
    pairs: [
      { id: 'p1', left: 'Chăm chỉ', right: 'Lười biếng' },
      { id: 'p2', left: 'Trung thực', right: 'Dối trá' },
      { id: 'p3', left: 'Khiêm tốn', right: 'Kiêu ngạo' },
    ],
    explanation: 'Các cặp từ trái nghĩa: Chăm chỉ – Lười biếng; Trung thực – Dối trá; Khiêm tốn – Kiêu ngạo.',
  },
  {
    topic: 'Từ đồng nghĩa',
    prompt: 'Nối mỗi từ ở cột trái với từ đồng nghĩa ở cột phải:',
    pairs: [
      { id: 'p1', left: 'Bao la', right: 'Mênh mông' },
      { id: 'p2', left: 'Dũng cảm', right: 'Gan dạ' },
      { id: 'p3', left: 'Tổ quốc', right: 'Giang sơn' },
    ],
    explanation: 'Bao la = Mênh mông; Dũng cảm = Gan dạ; Tổ quốc = Giang sơn.',
  },
  {
    topic: 'Hoàn thiện thành ngữ',
    prompt: 'Nối hai vế để tạo thành câu tục ngữ, thành ngữ đúng:',
    pairs: [
      { id: 'p1', left: 'Uống nước', right: 'nhớ nguồn' },
      { id: 'p2', left: 'Lá lành', right: 'đùm lá rách' },
      { id: 'p3', left: 'Tôn sư', right: 'trọng đạo' },
    ],
    explanation: 'Các câu đúng: Uống nước nhớ nguồn; Lá lành đùm lá rách; Tôn sư trọng đạo.',
  },
];

const TV_DT_BANK = [
  {
    topic: 'Tục ngữ Việt Nam',
    prompt: 'Điền 1 tiếng còn thiếu vào câu tục ngữ: "Có công mài sắt, có ngày nên ___."',
    acceptedAnswers: [['kim']],
    explanation: 'Câu tục ngữ đầy đủ là: "Có công mài sắt, có ngày nên kim" (khuyên kiên trì sẽ thành công).',
  },
  {
    topic: 'Thành ngữ truyền thống',
    prompt: 'Điền 1 tiếng còn thiếu: "Ăn quả nhớ kẻ trồng ___."',
    acceptedAnswers: [['cây', 'cay']],
    explanation: 'Câu tục ngữ đầy đủ là: "Ăn quả nhớ kẻ trồng cây".',
  },
  {
    topic: 'Từ trái nghĩa',
    prompt: 'Điền 1 tiếng thích hợp để hoàn chỉnh câu: "Đoàn kết thì sống, chia rẽ thì ___."',
    acceptedAnswers: [['chết', 'chet']],
    explanation: 'Câu tục ngữ đầy đủ: "Đoàn kết thì sống, chia rẽ thì chết".',
  },
  {
    topic: 'Tục ngữ về học tập',
    prompt: 'Điền 1 tiếng thích hợp: "Học thầy không tày học ___."',
    acceptedAnswers: [['bạn', 'ban']],
    explanation: 'Câu tục ngữ đầy đủ: "Học thầy không tày học bạn".',
  },
];

const TV_SX_BANK = [
  {
    topic: 'Sắp xếp từ thành câu đúng',
    prompt: 'Sắp xếp các cụm từ sau thành câu văn hoàn chỉnh:',
    correctOrder: ['Chúng em', 'rất yêu', 'ngôi trường', 'thân thương này.'],
    explanation: 'Câu đúng theo cấu trúc Chủ ngữ – Vị ngữ: "Chúng em rất yêu ngôi trường thân thương này."',
  },
  {
    topic: 'Sắp xếp câu tục ngữ',
    prompt: 'Sắp xếp các tiếng sau thành câu tục ngữ đúng:',
    correctOrder: ['Một', 'nụ cười', 'bằng', 'mười', 'thang thuốc bổ.'],
    explanation: 'Câu tục ngữ đúng: "Một nụ cười bằng mười thang thuốc bổ."',
  },
  {
    topic: 'Cấu trúc câu tiếng Việt',
    prompt: 'Sắp xếp các cụm từ sau thành câu miêu tả hoàn chỉnh:',
    correctOrder: ['Những tia nắng', 'ban mai', 'chiếu rọi', 'khắp sân trường.'],
    explanation: 'Câu hoàn chỉnh: "Những tia nắng ban mai chiếu rọi khắp sân trường."',
  },
];

const TV_CHON_BANK = [
  {
    topic: 'Phân loại Danh từ và Động từ',
    prompt: 'Xếp từng từ sau vào đúng giỏ Danh từ hoặc Động từ:',
    baskets: [
      { id: 'dt', label: 'Giỏ Danh từ' },
      { id: 'dongtu', label: 'Giỏ Động từ' },
    ],
    basketItems: [
      { id: 'i1', text: 'Quyển sách', basketId: 'dt' },
      { id: 'i2', text: 'Đọc bài', basketId: 'dongtu' },
      { id: 'i3', text: 'Bông hoa', basketId: 'dt' },
      { id: 'i4', text: 'Viết chữ', basketId: 'dongtu' },
    ],
    explanation: 'Danh từ chỉ sự vật: Quyển sách, Bông hoa. Động từ chỉ hoạt động: Đọc bài, Viết chữ.',
  },
  {
    topic: 'Phân loại Từ ghép và Từ láy',
    prompt: 'Xếp từng từ sau vào đúng giỏ Từ ghép hoặc Từ láy:',
    baskets: [
      { id: 'ghep', label: 'Giỏ Từ ghép' },
      { id: 'lay', label: 'Giỏ Từ láy' },
    ],
    basketItems: [
      { id: 'i1', text: 'Long lanh', basketId: 'lay' },
      { id: 'i2', text: 'Ông bà', basketId: 'ghep' },
      { id: 'i3', text: 'Rì rào', basketId: 'lay' },
      { id: 'i4', text: 'Bàn ghế', basketId: 'ghep' },
    ],
    explanation: 'Từ láy: Long lanh, Rì rào (lặp âm tạo âm hưởng). Từ ghép: Ông bà, Bàn ghế (ghép các tiếng có nghĩa).',
  },
];

// ============================================================
// 3. TOÁN BẰNG TIẾNG ANH (Math in English)
// ============================================================

function genMathEnTN(grade: Grade, round: RoundLevel, seq: number): Question {
  const mode = seq % 3;
  if (mode === 0) {
    const a = randInt(8 + grade * 3, 25 + grade * 8 + round * 5);
    const b = randInt(4, 15 + grade * 4);
    const isSum = seq % 2 === 0;
    const ans = isSum ? a + b : a - b;
    const { options, correctIndex } = uniqueNumberOptions(ans, [2, -2, 10, -1, 5]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan_tieng_anh',
      topic: 'Sum & Difference in English',
      prompt: isSum
        ? `What is the sum of ${a} and ${b}?`
        : `What is the difference when ${b} is subtracted from ${a}?`,
      options,
      correctIndex,
      explanation: isSum
        ? `"Sum" nghĩa là tổng: ${a} + ${b} = ${ans}.`
        : `"Difference" nghĩa là hiệu: ${a} − ${b} = ${ans}.`,
      source: 'sample',
    };
  } else if (mode === 1) {
    const a = randInt(3, 6 + grade);
    const b = randInt(4, 8 + round);
    const ans = a * b;
    const { options, correctIndex } = uniqueNumberOptions(ans, [a, -b, 2, -2, 5]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan_tieng_anh',
      topic: 'Product & Word Problems',
      prompt: `Each box has ${a} pencils. How many pencils are there in ${b} boxes altogether?`,
      options,
      correctIndex,
      explanation: `Mỗi hộp có ${a} bút chì, vậy ${b} hộp có tổng cộng ${a} × ${b} = ${ans} bút chì.`,
      source: 'sample',
    };
  } else {
    const side = randInt(4, 10 + grade + round);
    const ans = side * 4;
    const { options, correctIndex } = uniqueNumberOptions(ans, [side, -side, 4, -2, 8]);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'toan_tieng_anh',
      topic: 'Geometry Terms in English',
      prompt: `Find the perimeter of a square whose side length is ${side} cm.`,
      options: options.map((v) => `${v} cm`),
      correctIndex,
      explanation: `"Perimeter of a square" là chu vi hình vuông: ${side} × 4 = ${ans} cm.`,
      source: 'sample',
    };
  }
}

function genMathEnDT(grade: Grade, round: RoundLevel, seq: number): Question {
  const a = randInt(6, 15 + grade * 2);
  const b = randInt(3, 9 + round);
  const ans = a * b;
  return {
    id: makeId(grade, round, 'dt', seq),
    grade,
    round,
    type: 'dt',
    subject: 'toan_tieng_anh',
    topic: 'Multiplication in English',
    prompt: `The product of ${a} and ${b} is ___.`,
    acceptedAnswers: [[String(ans)]],
    explanation: `"Product" nghĩa là tích của hai số: ${a} × ${b} = ${ans}.`,
    source: 'sample',
  };
}

function genMathEnNoi(grade: Grade, round: RoundLevel, seq: number): Question {
  const sets = [
    [
      { id: 'p1', left: 'Sum', right: 'Tổng (phép cộng)' },
      { id: 'p2', left: 'Product', right: 'Tích (phép nhân)' },
      { id: 'p3', left: 'Perimeter', right: 'Chu vi' },
    ],
    [
      { id: 'p1', left: 'Triangle', right: 'Hình tam giác' },
      { id: 'p2', left: 'Rectangle', right: 'Hình chữ nhật' },
      { id: 'p3', left: 'Circle', right: 'Hình tròn' },
    ],
    [
      { id: 'p1', left: 'Even number', right: 'Số chẵn' },
      { id: 'p2', left: 'Odd number', right: 'Số lẻ' },
      { id: 'p3', left: 'Fraction', right: 'Phân số' },
    ],
  ];
  const pairs = sets[seq % sets.length];
  return {
    id: makeId(grade, round, 'noi', seq),
    grade,
    round,
    type: 'noi',
    subject: 'toan_tieng_anh',
    topic: 'Math Vocabulary Matching',
    prompt: 'Match each English math term on the left with its Vietnamese meaning on the right:',
    pairs,
    explanation: pairs.map((p) => `${p.left} = ${p.right}`).join('; '),
    source: 'sample',
  };
}

function genMathEnSX(grade: Grade, round: RoundLevel, seq: number): Question {
  const vals = new Set<number>();
  while (vals.size < 4) {
    vals.add(randInt(10, 50 + grade * 12 + round * 10));
  }
  const sorted = Array.from(vals).sort((a, b) => a - b).map(String);
  let shuffled = shuffleArray(sorted);
  if (shuffled.every((v, i) => v === sorted[i])) shuffled = [...sorted].reverse();
  return {
    id: makeId(grade, round, 'sx', seq),
    grade,
    round,
    type: 'sx',
    subject: 'toan_tieng_anh',
    topic: 'Ascending Order',
    prompt: 'Arrange the following numbers in ascending order (from smallest to greatest):',
    orderItems: shuffled,
    correctOrder: sorted,
    orderDirectionLabel: 'Smallest → Greatest',
    explanation: `"Ascending order" là thứ tự tăng dần từ bé đến lớn: ${sorted.join(' < ')}.`,
    source: 'sample',
  };
}

function genMathEnChon(grade: Grade, round: RoundLevel, seq: number): Question {
  const threshold = 20 + grade * 5;
  const lt1 = randInt(5, threshold - 3);
  const lt2 = randInt(lt1 + 1, threshold - 1);
  const gt1 = randInt(threshold + 2, threshold + 20);
  const gt2 = randInt(gt1 + 1, threshold + 35);
  return {
    id: makeId(grade, round, 'chon', seq),
    grade,
    round,
    type: 'chon',
    subject: 'toan_tieng_anh',
    topic: 'Number Comparison in English',
    prompt: `Sort each number into the right basket: "Less than ${threshold}" or "Greater than ${threshold}":`,
    baskets: [
      { id: 'less', label: `Less than ${threshold}` },
      { id: 'greater', label: `Greater than ${threshold}` },
    ],
    basketItems: shuffleArray([
      { id: 'i1', text: String(lt1), basketId: 'less' },
      { id: 'i2', text: String(lt2), basketId: 'less' },
      { id: 'i3', text: String(gt1), basketId: 'greater' },
      { id: 'i4', text: String(gt2), basketId: 'greater' },
    ]),
    explanation: `"Less than ${threshold}" (nhỏ hơn ${threshold}): ${lt1}, ${lt2}. "Greater than ${threshold}" (lớn hơn ${threshold}): ${gt1}, ${gt2}.`,
    source: 'sample',
  };
}

// ============================================================
// 4. TIẾNG ANH (English)
// ============================================================

const EN_TN_BANK = [
  {
    minG: 1,
    maxG: 5,
    topic: 'Present Simple Tense',
    prompt: 'Choose the correct word: "My sister ___ to school every morning."',
    options: ['goes', 'go', 'going', 'went'],
    correctIndex: 0,
    explanation: 'Chủ ngữ "My sister" là ngôi thứ 3 số ít ở thì hiện tại đơn (every morning) nên động từ thêm "-es": goes.',
  },
  {
    minG: 1,
    maxG: 5,
    topic: 'Prepositions of Time',
    prompt: 'Fill in the blank: "Our English class starts ___ 8 o’clock."',
    options: ['at', 'in', 'on', 'under'],
    correctIndex: 0,
    explanation: 'Trước giờ cụ thể (8 o’clock) ta luôn dùng giới từ "at".',
  },
  {
    minG: 2,
    maxG: 6,
    topic: 'Present Continuous',
    prompt: 'Look! The students ___ football in the schoolyard right now.',
    options: ['are playing', 'play', 'played', 'plays'],
    correctIndex: 0,
    explanation: 'Có dấu hiệu "Look!" và "right now" dùng thì hiện tại tiếp diễn: are playing.',
  },
  {
    minG: 4,
    maxG: 9,
    topic: 'Past Simple Tense',
    prompt: 'Yesterday, we ___ a very interesting science museum.',
    options: ['visited', 'visit', 'visiting', 'visits'],
    correctIndex: 0,
    explanation: 'Có trạng từ "Yesterday" nên chia động từ ở thì quá khứ đơn: visited.',
  },
  {
    minG: 5,
    maxG: 9,
    topic: 'Comparatives & Superlatives',
    prompt: 'Mount Fansipan is the ___ mountain in Vietnam.',
    options: ['highest', 'higher', 'high', 'most high'],
    correctIndex: 0,
    explanation: 'So sánh nhất của tính từ ngắn "high" có "the" đứng trước là "the highest".',
  },
  {
    minG: 6,
    maxG: 9,
    topic: 'First Conditional',
    prompt: 'If it ___ tomorrow, we will stay at home and read books.',
    options: ['rains', 'will rain', 'rained', 'raining'],
    correctIndex: 0,
    explanation: 'Câu điều kiện loại 1: If + S + V(hiện tại đơn), S + will + V. Với "it" ta chia "rains".',
  },
  {
    minG: 6,
    maxG: 9,
    topic: 'Passive Voice',
    prompt: 'This historic bridge ___ built over a hundred years ago.',
    options: ['was', 'were', 'is', 'has'],
    correctIndex: 0,
    explanation: 'Câu bị động quá khứ đơn với chủ ngữ số ít "This historic bridge" dùng "was built".',
  },
];

const EN_NOI_BANK = [
  {
    topic: 'English Antonyms',
    prompt: 'Nối mỗi từ tiếng Anh ở cột trái với từ trái nghĩa ở cột phải:',
    pairs: [
      { id: 'p1', left: 'Fast', right: 'Slow' },
      { id: 'p2', left: 'Heavy', right: 'Light' },
      { id: 'p3', left: 'Early', right: 'Late' },
    ],
    explanation: 'Fast (nhanh) – Slow (chậm); Heavy (nặng) – Light (nhẹ); Early (sớm) – Late (muộn).',
  },
  {
    topic: 'Vocabulary — School & Daily Life',
    prompt: 'Nối từ tiếng Anh ở cột trái với nghĩa tiếng Việt ở cột phải:',
    pairs: [
      { id: 'p1', left: 'Library', right: 'Thư viện' },
      { id: 'p2', left: 'Notebook', right: 'Quyển vở' },
      { id: 'p3', left: 'Homework', right: 'Bài tập về nhà' },
    ],
    explanation: 'Library = Thư viện; Notebook = Quyển vở; Homework = Bài tập về nhà.',
  },
  {
    topic: 'Irregular Verbs',
    prompt: 'Nối động từ nguyên thể (V1) với dạng quá khứ đơn (V2) tương ứng:',
    pairs: [
      { id: 'p1', left: 'Go', right: 'Went' },
      { id: 'p2', left: 'Write', right: 'Wrote' },
      { id: 'p3', left: 'See', right: 'Saw' },
    ],
    explanation: 'Quá khứ bất quy tắc: go → went, write → wrote, see → saw.',
  },
];

const EN_DT_BANK = [
  {
    topic: 'Verb "to be"',
    prompt: 'Fill in one word: "They ___ very happy to join the competition today."',
    acceptedAnswers: [['are']],
    explanation: 'Chủ ngữ số nhiều "They" ở hiện tại đi với động từ to be "are".',
  },
  {
    topic: 'Articles (a / an)',
    prompt: 'Fill in "a" or "an": "He eats ___ apple after lunch every day."',
    acceptedAnswers: [['an']],
    explanation: '"Apple" bắt đầu bằng nguyên âm /æ/ nên ta dùng mạo từ "an".',
  },
  {
    topic: 'Prepositions of Time',
    prompt: 'Fill in one preposition: "My birthday is ___ May 15th."',
    acceptedAnswers: [['on']],
    explanation: 'Trước ngày cụ thể (May 15th) ta dùng giới từ "on".',
  },
  {
    topic: 'Modal Verbs',
    prompt: 'Fill in one word: "Students ___ listen carefully to the teacher in class."',
    acceptedAnswers: [['should', 'must']],
    explanation: 'Dùng "should" (nên) hoặc "must" (phải) để diễn tả lời khuyên/quy tắc trong lớp học.',
  },
];

const EN_SX_BANK = [
  {
    topic: 'Sentence Ordering',
    prompt: 'Sắp xếp các từ sau thành câu tiếng Anh hoàn chỉnh:',
    correctOrder: ['I', 'like', 'learning', 'Math', 'every day.'],
    explanation: 'Câu hoàn chỉnh: "I like learning Math every day." (like + V-ing).',
  },
  {
    topic: 'Sentence Ordering',
    prompt: 'Sắp xếp các từ sau thành câu hỏi tiếng Anh đúng ngữ pháp:',
    correctOrder: ['What', 'subject', 'do', 'you', 'like best?'],
    explanation: 'Cấu trúc câu hỏi Wh-: "What subject do you like best?"',
  },
  {
    topic: 'Sentence Ordering',
    prompt: 'Sắp xếp các từ sau thành câu tiếng Anh đúng:',
    correctOrder: ['She', 'always', 'finishes', 'her homework', 'before dinner.'],
    explanation: 'Trạng từ tần suất "always" đứng trước động từ thường: "She always finishes her homework before dinner."',
  },
];

const EN_CHON_BANK = [
  {
    topic: 'Countable & Uncountable Nouns',
    prompt: 'Xếp mỗi danh từ tiếng Anh vào đúng giỏ Đếm được (Countable) hoặc Không đếm được (Uncountable):',
    baskets: [
      { id: 'c', label: 'Countable (Đếm được)' },
      { id: 'u', label: 'Uncountable (Không đếm được)' },
    ],
    basketItems: [
      { id: 'i1', text: 'Book', basketId: 'c' },
      { id: 'i2', text: 'Water', basketId: 'u' },
      { id: 'i3', text: 'Pencil', basketId: 'c' },
      { id: 'i4', text: 'Milk', basketId: 'u' },
    ],
    explanation: 'Book, Pencil đếm được (a book, two pencils). Water, Milk là chất lỏng không đếm được.',
  },
  {
    topic: 'Parts of Speech (Nouns & Verbs)',
    prompt: 'Phân loại các từ tiếng Anh vào đúng giỏ Noun (Danh từ) hoặc Verb (Động từ):',
    baskets: [
      { id: 'n', label: 'Noun (Danh từ)' },
      { id: 'v', label: 'Verb (Động từ)' },
    ],
    basketItems: [
      { id: 'i1', text: 'Teacher', basketId: 'n' },
      { id: 'i2', text: 'Swim', basketId: 'v' },
      { id: 'i3', text: 'School', basketId: 'n' },
      { id: 'i4', text: 'Read', basketId: 'v' },
    ],
    explanation: 'Teacher, School là danh từ (Noun); Swim, Read là động từ chỉ hành động (Verb).',
  },
];

function genVietnameseQuestion(grade: Grade, round: RoundLevel, type: QuestionType, seq: number): Question {
  if (type === 'tn') {
    const eligible = TV_TN_BANK.filter((q) => grade >= q.minG && grade <= q.maxG);
    const chosen = eligible[seq % eligible.length] || TV_TN_BANK[seq % TV_TN_BANK.length];
    // Shuffle options cleanly while tracking correct answer
    const indexed = chosen.options.map((text, i) => ({ text, isCorrect: i === chosen.correctIndex }));
    const shuffled = shuffleArray(indexed);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'tieng_viet',
      topic: chosen.topic,
      prompt: chosen.prompt,
      options: shuffled.map((x) => x.text),
      correctIndex: shuffled.findIndex((x) => x.isCorrect),
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  if (type === 'noi') {
    const chosen = TV_NOI_BANK[seq % TV_NOI_BANK.length];
    return {
      id: makeId(grade, round, 'noi', seq),
      grade,
      round,
      type: 'noi',
      subject: 'tieng_viet',
      topic: chosen.topic,
      prompt: chosen.prompt,
      pairs: chosen.pairs,
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  if (type === 'dt') {
    const chosen = TV_DT_BANK[seq % TV_DT_BANK.length];
    return {
      id: makeId(grade, round, 'dt', seq),
      grade,
      round,
      type: 'dt',
      subject: 'tieng_viet',
      topic: chosen.topic,
      prompt: chosen.prompt,
      acceptedAnswers: chosen.acceptedAnswers,
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  if (type === 'sx') {
    const chosen = TV_SX_BANK[seq % TV_SX_BANK.length];
    let shuffled = shuffleArray(chosen.correctOrder);
    if (shuffled.every((v, i) => v === chosen.correctOrder[i])) {
      shuffled = [...chosen.correctOrder].reverse();
    }
    return {
      id: makeId(grade, round, 'sx', seq),
      grade,
      round,
      type: 'sx',
      subject: 'tieng_viet',
      topic: chosen.topic,
      prompt: chosen.prompt,
      orderItems: shuffled,
      correctOrder: chosen.correctOrder,
      orderDirectionLabel: 'Ghép thành câu hoàn chỉnh',
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  const chosen = TV_CHON_BANK[seq % TV_CHON_BANK.length];
  return {
    id: makeId(grade, round, 'chon', seq),
    grade,
    round,
    type: 'chon',
    subject: 'tieng_viet',
    topic: chosen.topic,
    prompt: chosen.prompt,
    baskets: chosen.baskets,
    basketItems: shuffleArray(chosen.basketItems),
    explanation: chosen.explanation,
    source: 'sample',
  };
}

function genEnglishQuestion(grade: Grade, round: RoundLevel, type: QuestionType, seq: number): Question {
  if (type === 'tn') {
    const eligible = EN_TN_BANK.filter((q) => grade >= q.minG && grade <= q.maxG);
    const chosen = eligible[seq % eligible.length] || EN_TN_BANK[seq % EN_TN_BANK.length];
    const indexed = chosen.options.map((text, i) => ({ text, isCorrect: i === chosen.correctIndex }));
    const shuffled = shuffleArray(indexed);
    return {
      id: makeId(grade, round, 'tn', seq),
      grade,
      round,
      type: 'tn',
      subject: 'tieng_anh',
      topic: chosen.topic,
      prompt: chosen.prompt,
      options: shuffled.map((x) => x.text),
      correctIndex: shuffled.findIndex((x) => x.isCorrect),
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  if (type === 'noi') {
    const chosen = EN_NOI_BANK[seq % EN_NOI_BANK.length];
    return {
      id: makeId(grade, round, 'noi', seq),
      grade,
      round,
      type: 'noi',
      subject: 'tieng_anh',
      topic: chosen.topic,
      prompt: chosen.prompt,
      pairs: chosen.pairs,
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  if (type === 'dt') {
    const chosen = EN_DT_BANK[seq % EN_DT_BANK.length];
    return {
      id: makeId(grade, round, 'dt', seq),
      grade,
      round,
      type: 'dt',
      subject: 'tieng_anh',
      topic: chosen.topic,
      prompt: chosen.prompt,
      acceptedAnswers: chosen.acceptedAnswers,
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  if (type === 'sx') {
    const chosen = EN_SX_BANK[seq % EN_SX_BANK.length];
    let shuffled = shuffleArray(chosen.correctOrder);
    if (shuffled.every((v, i) => v === chosen.correctOrder[i])) {
      shuffled = [...chosen.correctOrder].reverse();
    }
    return {
      id: makeId(grade, round, 'sx', seq),
      grade,
      round,
      type: 'sx',
      subject: 'tieng_anh',
      topic: chosen.topic,
      prompt: chosen.prompt,
      orderItems: shuffled,
      correctOrder: chosen.correctOrder,
      orderDirectionLabel: 'Sắp xếp thành câu đúng',
      explanation: chosen.explanation,
      source: 'sample',
    };
  }
  const chosen = EN_CHON_BANK[seq % EN_CHON_BANK.length];
  return {
    id: makeId(grade, round, 'chon', seq),
    grade,
    round,
    type: 'chon',
    subject: 'tieng_anh',
    topic: chosen.topic,
    prompt: chosen.prompt,
    baskets: chosen.baskets,
    basketItems: shuffleArray(chosen.basketItems),
    explanation: chosen.explanation,
    source: 'sample',
  };
}

export function generateSampleQuestions(
  grade: Grade,
  round: RoundLevel,
  count: number,
  subjectFilter: SubjectCode | 'all' = 'all'
): Question[] {
  const subjects: SubjectCode[] =
    subjectFilter === 'all'
      ? ['toan', 'tieng_viet', 'toan_tieng_anh', 'tieng_anh']
      : [subjectFilter];

  // Realistic VioEdu distribution across 5 interactive question types
  const typeCycle: QuestionType[] = [
    'tn',
    'tn',
    'tn',
    'dt',
    'dt',
    'noi',
    'sx',
    'chon',
    'tn',
    'dt',
  ];

  const questions: Question[] = [];
  const usedPrompts = new Set<string>();

  for (let i = 0; i < count; i++) {
    const seq = i + 1;
    const subject = subjects[i % subjects.length];
    const type = typeCycle[i % typeCycle.length];

    let q: Question;
    if (subject === 'toan') {
      if (type === 'tn') q = genMathTN(grade, round, seq);
      else if (type === 'noi') q = genMathNoi(grade, round, seq);
      else if (type === 'dt') q = genMathDT(grade, round, seq);
      else if (type === 'sx') q = genMathSX(grade, round, seq);
      else q = genMathChon(grade, round, seq);
    } else if (subject === 'toan_tieng_anh') {
      if (type === 'tn') q = genMathEnTN(grade, round, seq);
      else if (type === 'noi') q = genMathEnNoi(grade, round, seq);
      else if (type === 'dt') q = genMathEnDT(grade, round, seq);
      else if (type === 'sx') q = genMathEnSX(grade, round, seq);
      else q = genMathEnChon(grade, round, seq);
    } else if (subject === 'tieng_viet') {
      q = genVietnameseQuestion(grade, round, type, seq);
    } else {
      q = genEnglishQuestion(grade, round, type, seq);
    }

    // Ensure mathematical questions stay unique if a prompt collides
    if (usedPrompts.has(q.prompt) && (subject === 'toan' || subject === 'toan_tieng_anh')) {
      q = subject === 'toan' ? genMathTN(grade, round, seq + 100) : genMathEnTN(grade, round, seq + 100);
    }
    q = {
      ...q,
      id: `l${grade}_c${round}_${SUBJECT_ID_CODE[q.subject]}__${q.type}_${String(seq).padStart(3, '0')}`,
    };
    usedPrompts.add(q.prompt);
    questions.push(q);
  }

  return questions;
}
