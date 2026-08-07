package com.forgeops.backend.terminal.dto;

import java.util.List;

public class CommandExplanationResponse {

    private String command;
    private String safetyLevel; // SAFE, CAUTION, DANGEROUS
    private String riskExplanation;
    private List<FlagExplanation> flags;
    private String safeAlternative;
    private String summary;

    public CommandExplanationResponse() {}

    public CommandExplanationResponse(String command, String safetyLevel, String riskExplanation,
                                      List<FlagExplanation> flags, String safeAlternative, String summary) {
        this.command = command;
        this.safetyLevel = safetyLevel;
        this.riskExplanation = riskExplanation;
        this.flags = flags;
        this.safeAlternative = safeAlternative;
        this.summary = summary;
    }

    public String getCommand() { return command; }
    public String getSafetyLevel() { return safetyLevel; }
    public String getRiskExplanation() { return riskExplanation; }
    public List<FlagExplanation> getFlags() { return flags; }
    public String getSafeAlternative() { return safeAlternative; }
    public String getSummary() { return summary; }

    public static class FlagExplanation {
        private String flag;
        private String description;

        public FlagExplanation() {}
        public FlagExplanation(String flag, String description) {
            this.flag = flag;
            this.description = description;
        }

        public String getFlag() { return flag; }
        public String getDescription() { return description; }
    }
}
