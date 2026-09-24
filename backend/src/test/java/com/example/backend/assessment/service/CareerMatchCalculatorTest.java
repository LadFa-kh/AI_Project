package com.example.backend.assessment.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** B1: เปอร์เซ็นต์ของ careerMatches ต้องรวมกันได้ 100 พอดีเสมอ รวมถึงกรณีปัดเศษ */
class CareerMatchCalculatorTest {

    private static int sum(List<Integer> xs) { return xs.stream().mapToInt(Integer::intValue).sum(); }

    @Test
    void threeEqualWeights_roundsTo34_33_33() {
        List<Integer> p = CareerMatchCalculator.toPercentages(List.of(1.0, 1.0, 1.0));
        assertEquals(List.of(34, 33, 33), p);
        assertEquals(100, sum(p));
    }

    @Test
    void roundingCase_sumsTo100() {
        // 66.67 / 16.67 / 16.67 — ปัดธรรมดาจะได้ 67+17+17 = 101
        List<Integer> p = CareerMatchCalculator.toPercentages(List.of(80.0, 20.0, 20.0));
        assertEquals(100, sum(p));
        assertEquals(List.of(67, 17, 16), p);
    }

    @Test
    void fourRoles_sumsTo100() {
        List<Integer> p = CareerMatchCalculator.toPercentages(List.of(55.5, 30.25, 12.1, 3.3));
        assertEquals(4, p.size());
        assertEquals(100, sum(p));
    }

    @Test
    void singleRole_is100() {
        assertEquals(List.of(100), CareerMatchCalculator.toPercentages(List.of(42.0)));
    }

    @Test
    void allZero_splitsEvenly() {
        List<Integer> p = CareerMatchCalculator.toPercentages(List.of(0.0, 0.0));
        assertEquals(List.of(50, 50), p);
    }

    @Test
    void empty_returnsEmpty() {
        assertTrue(CareerMatchCalculator.toPercentages(List.of()).isEmpty());
    }
}
