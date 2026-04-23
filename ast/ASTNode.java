package ast;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class ASTNode {
    public String type;
    public String value;
    public List<ASTNode> children = new ArrayList<>();

    public ASTNode(String type) {
        this.type = type;
    }

    public ASTNode(String type, String value) {
        this.type = type;
        this.value = value;
    }
}