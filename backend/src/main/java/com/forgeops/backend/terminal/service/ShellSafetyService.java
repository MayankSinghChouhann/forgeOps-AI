package com.forgeops.backend.terminal.service;

import com.forgeops.backend.assistant.service.GeminiAiService;
import com.forgeops.backend.terminal.dto.CommandExplanationResponse;
import com.forgeops.backend.terminal.dto.CommandExplanationResponse.FlagExplanation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ShellSafetyService {

    private static final Logger log = LoggerFactory.getLogger(ShellSafetyService.class);

    private final GeminiAiService geminiAiService;

    public ShellSafetyService(GeminiAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    public CommandExplanationResponse explainCommand(String rawCommand) {
        String trimmed = (rawCommand != null) ? rawCommand.trim() : "";
        String lower = trimmed.toLowerCase(Locale.ROOT);

        String safetyLevel = "SAFE";
        String riskExplanation = "This command performs read-only or standard non-destructive operations.";
        String safeAlternative = null;
        List<FlagExplanation> flags = extractFlags(trimmed);

        // 1. Check for DANGEROUS patterns
        if (lower.contains("rm -rf /") || lower.contains("rm -rf /*") || lower.contains("rm -rf ~") ||
            lower.contains("mkfs") || lower.contains("dd if=/dev/zero") || lower.contains("> /dev/sda") ||
            lower.contains("chmod -r 777 /") || lower.contains("kill -9 1") || lower.contains(":(){ :|:& };:") ||
            lower.contains("drop database") || lower.contains("drop table")) {
            safetyLevel = "DANGEROUS";
            riskExplanation = "🚨 CRITICAL RISK: This command is catastrophic! It will recursively delete the root file system, wipe disks, kill PID 1, or destroy databases permanently.";
            safeAlternative = "Use targeted file deletion with confirmation: `rm -i <specific_file>` or inspect with `ls -la` first.";
        }
        // 2. Check for CAUTION patterns
        else if (lower.contains("docker system prune -a") || lower.contains("prune --volumes") ||
                 lower.contains("iptables -f") || lower.contains("systemctl stop") ||
                 lower.contains("ufw disable") || lower.contains("git reset --hard") ||
                 lower.contains("git push --force") || lower.contains("pkill -9") ||
                 lower.contains("reboot") || lower.contains("shutdown") || lower.contains("drop schema")) {
            safetyLevel = "CAUTION";
            riskExplanation = "⚠️ CAUTION: This command alters system-wide network configuration, kills multiple processes, or irreversibly prunes data/containers.";
            safeAlternative = "Run with dry-run flag or preview targets first (e.g. `docker system df` before pruning).";
        }

        String summary = generateCommandSummary(trimmed, safetyLevel);

        // If Gemini is available, enhance with deep AI explanation
        if (geminiAiService.isConfigured()) {
            try {
                String aiPrompt = String.format(
                    "You are a Senior Linux & Systems Engineer. Explain this shell command:\n`%s`\n\n" +
                    "Break down:\n" +
                    "1. What it does step-by-step\n" +
                    "2. Safety risks\n" +
                    "3. Recommended alternative or best practice.\n" +
                    "Keep the response concise, formatted in markdown.",
                    trimmed
                );
                String aiResponse = geminiAiService.generateDevOpsResponse(aiPrompt);
                if (aiResponse != null && !aiResponse.isBlank()) {
                    summary = aiResponse;
                }
            } catch (Exception e) {
                log.warn("[ShellSafetyService] Gemini explanation fallback: {}", e.getMessage());
            }
        }

        return new CommandExplanationResponse(trimmed, safetyLevel, riskExplanation, flags, safeAlternative, summary);
    }

    public String generateCommand(String prompt) {
        if (geminiAiService.isConfigured()) {
            try {
                String aiPrompt = String.format(
                    "You are a Linux & DevOps CLI expert. The user wants to achieve this goal:\n" +
                    "\"%s\"\n\n" +
                    "Provide the EXACT one-liner command in a bash code block, followed by a 1-sentence explanation.",
                    prompt
                );
                String resp = geminiAiService.generateDevOpsResponse(aiPrompt);
                if (resp != null && !resp.isBlank()) {
                    return resp;
                }
            } catch (Exception e) {
                log.warn("[ShellSafetyService] Gemini command generation fallback: {}", e.getMessage());
            }
        }

        // Rule-based fallback generator
        String lower = prompt.toLowerCase(Locale.ROOT);
        if (lower.contains("find large files") || lower.contains("disk space")) {
            return "```bash\nfind / -type f -size +100M -exec ls -lh {} \\; 2>/dev/null | awk '{ print $9 \": \" $5 }'\n```\nFinds all files larger than 100MB across the filesystem and prints their sizes.";
        } else if (lower.contains("port") || lower.contains("listening")) {
            return "```bash\nss -tulpn | grep LISTEN\n```\nLists all active TCP/UDP listening sockets with associated process IDs.";
        } else if (lower.contains("docker logs") || lower.contains("container log")) {
            return "```bash\ndocker logs --tail=100 -f <container_name>\n```\nFollows the last 100 lines of container stdout/stderr in real-time.";
        } else if (lower.contains("top memory") || lower.contains("ram usage")) {
            return "```bash\nps aux --sort=-%mem | head -n 10\n```\nLists the top 10 memory-consuming processes on the Linux host.";
        } else {
            return "```bash\njournalctl -xeu <service-name> -f\n```\nStreams live systemd journal diagnostic logs for troubleshooting.";
        }
    }

    private List<FlagExplanation> extractFlags(String command) {
        List<FlagExplanation> flags = new ArrayList<>();
        String[] parts = command.split("\\s+");
        for (String p : parts) {
            if (p.startsWith("-")) {
                flags.add(new FlagExplanation(p, explainFlag(p, parts[0])));
            }
        }
        return flags;
    }

    private String explainFlag(String flag, String baseCmd) {
        return switch (flag) {
            case "-rf", "-fr" -> "Recursive (-r) and Force (-f) — bypasses confirmations and descends into directory hierarchies.";
            case "-r", "-R" -> "Recursive operation — applies the command to directory trees.";
            case "-f", "--force" -> "Force flag — suppresses interactive confirmation prompts and ignores non-existent files.";
            case "-a", "-all", "--all" -> "All — includes hidden files, stopped containers, or inactive sockets.";
            case "-v", "--verbose" -> "Verbose mode — outputs detailed step-by-step progress to stdout.";
            case "-p", "--parents" -> "Parents / Port flag — creates parent directories or preserves file attributes.";
            case "-i" -> "Interactive mode — prompts the user for confirmation before each deletion or action.";
            case "-l" -> "Long listing format — displays permissions, owner, group, file size, and timestamp.";
            case "-h", "--human-readable" -> "Human-readable format — prints units in KB, MB, GB instead of raw bytes.";
            case "-d", "--detach" -> "Detached mode — executes container or process in the background.";
            case "--publish" -> "Publish port — forwards container port to host interface.";
            default -> "Modifier argument passed to " + baseCmd + ".";
        };
    }

    private String generateCommandSummary(String command, String safetyLevel) {
        return String.format("""
### 💻 Shell Command Audit: `%s`

- **Safety Status**: %s
- **Interpreter**: Linux POSIX Shell / Bash

#### 🔍 Execution Breakdown:
The command evaluates the requested flags and applies them to the specified targets in the user space.
""", command, safetyLevel);
    }
}
