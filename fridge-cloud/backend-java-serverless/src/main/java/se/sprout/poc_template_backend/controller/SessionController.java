package se.sprout.poc_template_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import se.sprout.model.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
public class SessionController {

    @GetMapping("/api/v1/sessions")
    public List<SessionSummary> listSessions() {
        return List.of(
                new SessionSummary()
                        .sessionId("sess-001")
                        .status(new Status().state("active"))
                        .putMetaItem("startedAt", "2026-03-04T10:00:00Z")
                        .putTxSummaryItem("ADD", 3)
                        .putTxSummaryItem("REMOVE", 1),
                new SessionSummary()
                        .sessionId("sess-002")
                        .status(new Status().state("done"))
                        .putMetaItem("startedAt", "2026-03-04T09:00:00Z")
                        .putTxSummaryItem("ADD", 5)
                        .putTxSummaryItem("REMOVE", 2)
        );
    }

    @GetMapping("/api/v1/sessions/{id}")
    public SessionDetail getSession(@PathVariable String id) {
        return new SessionDetail()
                .sessionId(id)
                .status(new Status().state("active"))
                .putMetaItem("startedAt", "2026-03-04T10:00:00Z")
                .addTransactionsItem(new Transaction()
                        .txId("tx-001")
                        .type(Transaction.TypeEnum.ADD)
                        .item(new Item().label("milk"))
                        .confidence(BigDecimal.valueOf(0.95)))
                .addTransactionsItem(new Transaction()
                        .txId("tx-002")
                        .type(Transaction.TypeEnum.ADD)
                        .item(new Item().label("eggs"))
                        .confidence(BigDecimal.valueOf(0.88)))
                .addTransactionsItem(new Transaction()
                        .txId("tx-003")
                        .type(Transaction.TypeEnum.REMOVE)
                        .item(new Item().label("butter"))
                        .confidence(BigDecimal.valueOf(0.92)))
                .addFramesItem("frame-001.jpg")
                .addFramesItem("frame-002.jpg")
                .addFramesItem("frame-003.jpg")
                .framesSubdir("sessions/" + id + "/frames");
    }

    @GetMapping("/api/v1/history")
    public List<SessionSummary> listHistory() {
        return List.of(
                new SessionSummary()
                        .sessionId("hist-001")
                        .status(new Status().state("done"))
                        .putMetaItem("startedAt", "2026-03-03T08:00:00Z")
                        .putTxSummaryItem("ADD", 4)
                        .putTxSummaryItem("REMOVE", 2),
                new SessionSummary()
                        .sessionId("hist-002")
                        .status(new Status().state("done"))
                        .putMetaItem("startedAt", "2026-03-02T14:30:00Z")
                        .putTxSummaryItem("ADD", 6)
                        .putTxSummaryItem("REMOVE", 3),
                new SessionSummary()
                        .sessionId("hist-003")
                        .status(new Status().state("done"))
                        .putMetaItem("startedAt", "2026-03-01T11:15:00Z")
                        .putTxSummaryItem("ADD", 2)
                        .putTxSummaryItem("REMOVE", 1)
        );
    }

    @GetMapping("/api/v1/history/{id}")
    public SessionDetail getHistorySession(@PathVariable String id) {
        return new SessionDetail()
                .sessionId(id)
                .status(new Status().state("done"))
                .putMetaItem("startedAt", "2026-03-03T08:00:00Z")
                .addTransactionsItem(new Transaction()
                        .txId("tx-h01")
                        .type(Transaction.TypeEnum.ADD)
                        .item(new Item().label("cheese"))
                        .confidence(BigDecimal.valueOf(0.91)))
                .addTransactionsItem(new Transaction()
                        .txId("tx-h02")
                        .type(Transaction.TypeEnum.REMOVE)
                        .item(new Item().label("yogurt"))
                        .confidence(BigDecimal.valueOf(0.87)))
                .addFramesItem("frame-001.jpg")
                .addFramesItem("frame-002.jpg")
                .framesSubdir("history/" + id + "/frames");
    }

    @GetMapping("/api/v1/stats")
    public Stats getStats() {
        return new Stats()
                .diskUsageTotal(new DiskUsage()
                        .usedBytes(524288000L)
                        .maxBytes(2147483648L)
                        .usedPct(BigDecimal.valueOf(24.4)))
                .diskUsageSessions(new DiskUsage()
                        .usedBytes(314572800L)
                        .maxBytes(2147483648L)
                        .usedPct(BigDecimal.valueOf(14.6)))
                .diskUsageHistory(new DiskUsage()
                        .usedBytes(209715200L)
                        .maxBytes(2147483648L)
                        .usedPct(BigDecimal.valueOf(9.8)));
    }
}
