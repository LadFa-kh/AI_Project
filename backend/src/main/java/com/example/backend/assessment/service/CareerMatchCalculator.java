package com.example.backend.assessment.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

/**
 * B1: แปลงน้ำหนักของแต่ละอาชีพเป็นเปอร์เซ็นต์จำนวนเต็มที่ "รวมกันได้ 100 พอดี"
 *
 * ปัดเศษตรง ๆ แล้วมักได้ 99 หรือ 101 (เช่น 33.3+33.3+33.3 → 33+33+33 = 99)
 * จึงใช้วิธี largest remainder: ปัดลงทุกตัวก่อน แล้วแจกแต้มที่ขาดให้ตัวที่เศษเยอะสุดทีละ 1
 * เศษเท่ากัน → ตัวที่อยู่ลำดับก่อน (น้ำหนักสูงกว่า) ได้ก่อน ผลจึงคงที่ทุกครั้ง
 */
public final class CareerMatchCalculator {

    private CareerMatchCalculator() {}

    public static List<Integer> toPercentages(List<Double> weights) {
        if (weights == null || weights.isEmpty()) return List.of();
        double total = weights.stream().mapToDouble(w -> Math.max(0, w)).sum();
        int n = weights.size();
        if (total <= 0) {
            // ไม่มีข้อมูลให้แยกเลย → แบ่งเท่า ๆ กัน
            return toPercentages(new ArrayList<>(java.util.Collections.nCopies(n, 1.0)));
        }
        int[] floor = new int[n];
        double[] rem = new double[n];
        int sum = 0;
        for (int i = 0; i < n; i++) {
            double exact = Math.max(0, weights.get(i)) * 100.0 / total;
            floor[i] = (int) Math.floor(exact);
            rem[i] = exact - floor[i];
            sum += floor[i];
        }
        int left = 100 - sum;
        List<Integer> order = IntStream.range(0, n).boxed()
                .sorted(Comparator.<Integer>comparingDouble(i -> -rem[i]).thenComparingInt(i -> i))
                .toList();
        for (int k = 0; k < left; k++) floor[order.get(k % n)]++;
        List<Integer> out = new ArrayList<>(n);
        for (int v : floor) out.add(v);
        return out;
    }
}
