package tokenizer;

public class Token {
    private String type;
    private String value;

    public Token(String type, String value) {
        this.type = type;
        this.value = value;
    }

    public String getType(){
        return this.type;
    }
    public String getValue(){
        return this.value;
    }

    public String toString() {
        return type + " : " + value;
    }

}